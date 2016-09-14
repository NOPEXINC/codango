from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.template import RequestContext, loader
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.generic.edit import CreateView
from django.views.generic.list import ListView
from resources.views import LoginRequiredMixin
from .forms import CommunityForm
from django.views.generic import View, TemplateView
from django.contrib.auth.models import User
from community.models import CommunityMember, Community
from django.http import HttpResponse, HttpResponseNotFound
# Create your views here.


class CommunityCreateView(LoginRequiredMixin, TemplateView):
    template_name = 'community/community-create.html'
    form_class = CommunityForm

    def dispatch(self, request, *args, **kwargs):
        return super(CommunityCreateView, self).dispatch(
            request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(CommunityCreateView, self).get_context_data(**kwargs)
        context['community_form'] = CommunityForm()
        return context

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            form.instance.creator = self.request.user
            form.save()
            return redirect(
                '/community/{}'.format(form.instance.id)
            )

        else:
            context = super(CommunityCreateView,
                            self).get_context_data(**kwargs)
            context['community_form'] = form
            return render(request, self.template_name, context)


class CommunityDetailView(LoginRequiredMixin, TemplateView):
    template_name = 'community/community.html'


class CommunityListView(LoginRequiredMixin, TemplateView):
    template_name = 'community/community_list.html'

    def get_context_data(self, **kwargs):
        context = super(CommunityListView, self).get_context_data(**kwargs)
        context['communities'] = Community.objects.all()
        return context



class JoinCommunityView(View):

    def post(self, request, *args, **kwargs):
        community = Community.objects.get(pk=kwargs.get('community_id'))
        creator = community.creator
        print(community.private)
        if self.request.user and not community.private:
            new_member = CommunityMember(community=community,
                                         user=self.request.user, invitor=creator,
                                         status='approved')
            new_member.save()
            return redirect('/community/{}'.format(kwargs.get('community_id')))
        else:
            # if it's a private community send community admin a notification
            if self.request.user and community.private:
                return redirect('/community/')
