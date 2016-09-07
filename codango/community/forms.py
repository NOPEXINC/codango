from django.forms import ModelForm

from .models import Community


class CommunityForm(ModelForm):

    class Meta:
        model = Community
        exclude = ['creator', 'tags']
