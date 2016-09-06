from community import views
from django.conf.urls import url

urlpatterns = [
    url(r'^create$',
        views.CommunityCreateView.as_view(), name='community_create'),
    url(r'^(?P<community_id>[0-9]+)$',
        views.CommunityDetailView.as_view(), name='community_detail'),
]
