from community.models import Community
from django.contrib.auth.models import User
from django.test import TestCase


class TestCommunity(TestCase):

    def setUp(self):
        self.user = User.objects.create(
            username='test_user', password='test_password')
        self.user.set_password('test_password')
        self.user.save()
        self.login = self.client.login(
            username='test_user', password='test_password')

    def test_communinity_create(self):
        """Test that users can create community"""
        self.assertTrue(self.login)
        response = self.client.post('/community/create', {
            'name': 'Test Community',
            'description': 'This is a test community',
            'private': True,
            'visibility': 'none',
            'default_group_permissions': 'BLOCK_MEMBER',
            'creator': self.user
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Community.objects.exists())
