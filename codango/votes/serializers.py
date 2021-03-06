from rest_framework import serializers

from models import Vote


class VoteSerializer(serializers.ModelSerializer):

    """Vote Serializer"""
    class Meta:
        model = Vote
        fields = ('user', 'resource', 'vote', 'time_stamp')

        read_only_fields = ('time_stamp')
