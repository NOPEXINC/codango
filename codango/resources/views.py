import json

from account.emails import SendGrid
from codango.settings.base import CODANGO_EMAIL
from comments.forms import CommentForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseNotFound
from django.template import loader
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView, View
from resources.forms import ResourceForm
from resources.models import NotificationQueue, Resource
from userprofile.models import Notification
from votes.models import Vote


class LoginRequiredMixin(object):

    @method_decorator(login_required(login_url='/'))
    def dispatch(self, request, *args, **kwargs):
        return super(LoginRequiredMixin, self).dispatch(
            request, *args, **kwargs)


class CommunityBaseView(LoginRequiredMixin, TemplateView):
    template_name = 'account/home.html'

    def dispatch(self, request, *args, **kwargs):

        return super(
            CommunityBaseView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        if self.request.is_ajax():
            self.template_name = 'account/partials/community.html'

        sortby = self.request.GET[
            'sortby'] if 'sortby' in self.request.GET else 'date'

        query = self.request.GET[
            'q'] if 'q' in self.request.GET else ''

        resources = self.sort_by(sortby,
                                 Resource.objects.filter(
                                     Q(text__contains=query) |
                                     Q(snippet_text__contains=query) |
                                     Q(resource_file_name__contains=query)))

        users = User.objects.filter(
            Q(username__contains=query) |
            Q(first_name__contains=query) |
            Q(last_name__contains=query) | Q(email__contains=query))
        community = kwargs[
            'community'].upper() if 'community' in kwargs else 'ALL'

        if community == 'UNTAGGED':
            resources = resources

        elif community != 'ALL':
            resources = resources.filter(language_tags=community)

        context = {
            'resources': resources,
            'commentform': CommentForm(auto_id=False),
            'title': 'Activity Feed'
            if query == '' else query + " Search results",
            'q': query,
            'users': users
        }
        return context

    @staticmethod
    def sort_by(sorting_name, object_set):
        if sorting_name == 'date':
            return object_set.order_by('-date_modified')
        elif sorting_name == 'votes':
            results = object_set.raw(
                "SELECT resources_resource.id, votes_vote.resource_id,\
                resources_resource.date_added,\
                sum(case when votes_vote.vote=true then 1  when\
                votes_vote.vote=false then -1 else 0 end)  \
                as vote_diff from votes_vote right join resources_resource \
                on resources_resource.id = votes_vote.resource_id \
                group by votes_vote.resource_id, resources_resource.id \
                order by vote_diff desc, resources_resource.date_added desc")
            return list(results)
        else:
            return object_set.annotate(
                num_sort=Count(sorting_name)).order_by('-num_sort')


class CommunityView(CommunityBaseView):
    form_class = ResourceForm

    def post(self, request, *args, **kwargs):

        try:
            resource_id = request.POST.get('resource_id', 0)
            resource = None
            edit = False
            if resource_id:
                resource = Resource.objects.get(
                    id=resource_id, author=request.user)
                edit = True
                if resource:
                    if request.POST.get('snippet_text', None) is None:
                        request.POST['snippet_text'] = resource.snippet_text
            form = self.form_class(
                request.POST, request.FILES, instance=resource)
            resource = form.save(commit=False)
            try:
                resource.resource_file_name = form.files['resource_file'].name
                resource.resource_file_size = form.files['resource_file'].size
            except KeyError:
                pass
            # a list of Follow objects
            user_follow_objs = self.request.user.profile.get_following()
            resource.author = self.request.user
            resource.save()
            response_dict = {
                "content": self.request.user.username +
                " Posted a new resource",
                "link": "#",
                "type": "newpost" if not edit else "updatepost",
                "read": False,
                "user_id": [follow.follower.id for follow in user_follow_objs],
                "status": "Successfully Posted Your Resource"
                if not edit else 'Resource Successfully Updated'
            }
            response_json = json.dumps(response_dict)
            return HttpResponse(response_json, content_type="application/json")
        except ValueError:
            return HttpResponseNotFound("emptypost")
        except:
            return HttpResponseNotFound("invalidfile")


class ResourceVoteView(View):

    def post(self, request, **kwargs):
        action = kwargs['action']
        resource_id = kwargs['resource_id']
        resource = Resource.objects.filter(id=resource_id).first()
        user_id = self.request.user.id
        vote = Vote.objects.filter(
            resource_id=resource_id, user_id=user_id).first()
        vote_mapping = {
            'likes': True,
            'unlikes': False,
        }
        # Create a vote object if the user has not voted yet
        if vote is None:
            vote = Vote()
            vote.resource = resource
            vote.user = self.request.user
        if vote.vote is None or vote.vote is not vote_mapping[action]:
            # If user has not voted yet or is changing his vote set vote to
            # current vote
            vote.vote = vote_mapping[action]
            status = action
            vote.save()
        else:
            vote.delete()
            status = "unvotes"

        response_dict = {
            "upvotes": len(resource.upvotes()),
            "downvotes": len(resource.downvotes()),
            "status": status,
        }

        if user_id != resource.author.id:
            response_dict.update(
                {"content": vote.user.username +
                    " " + status + " your resource",
                 "link": reverse(
                    'single_post', kwargs={'resource_id': vote.resource.id}),
                 "type": "vote",
                 "read": False,
                 "user_id": resource.author.id})

        response_json = json.dumps(response_dict)
        return HttpResponse(response_json, content_type="application/json")


class SinglePostView(LoginRequiredMixin, TemplateView):
    template_name = 'resources/single-post.html'

    def delete(self, request, *args, **kwargs):
        resource = Resource.objects.get(
            id=kwargs['resource_id'], author=request.user)
        if resource:
            resource.delete()
            response_dict = {
                "status": "Resource successfully deleted"
            }
            response_json = json.dumps(response_dict)
            return HttpResponse(response_json, content_type="application/json")
        else:
            return HttpResponseNotFound("Unknown resource")

    def get_context_data(self, **kwargs):
        context = super(SinglePostView, self).get_context_data(**kwargs)
        context['commentform'] = CommentForm(auto_id=False)
        try:
            context['resource'] = Resource.objects.get(
                id=kwargs['resource_id'])
        except Resource.DoesNotExist:
            context['title'] = 'Viewing post'
        return context


class ResourceEditView(LoginRequiredMixin, TemplateView):
    template_name = 'resources/edit-post.html'

    def get_context_data(self, **kwargs):
        context = super(ResourceEditView, self).get_context_data(**kwargs)
        try:
            context['resource'] = \
                Resource.objects.get(id=kwargs['resource_id'])
        except Resource.DoesNotExist:
            pass
        context['title'] = 'Editing post'
        return context
