
from django.test import Client, TestCase
import time
from django.contrib.auth.models import User
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test.utils import setup_test_environment
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from community.models import *
from django.test.utils import setup_test_environment
setup_test_environment()


class JoinCommunityTest(TestCase):

    def setUp(self):
        self.client = Client()
        #  create and login user who creates communities
        self.user = User.objects.create(username='New', password='community')
        self.user.set_password('community')
        self.user.save()
        self.login = self.client.login(username='New', password='member')
        # create public $ private communities
        self.public_community = Community(
            name="Public Community", private=False, creator=self.user)
        self.private_community = Community(
            name="Private Community", private=True, creator=self.user)
        #  create the user to join the communities
        self.user_to_join_community = User.objects.create(
            username='Join', password='join')
        self.user_to_join_community.set_password('join')
        self.user_to_join_community.save()
        self.login = self.client.login(username='Join', password='join')

    def test_user_can_join_public_community(self):
        """Test user can join a public community"""
        self.assertTrue(self.login)
        community = CommunityMember(community=self.public_community, user=self.user_to_join_community,
                                    invitor=None, status="approved")
        community.save()
        assertTrue(community.get_no_of_members() == 1)
        response = self.client.post(
            '/join_community/', content_type='application/json', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "success")

    def test_user_cant_join_private_community(self):
        """Test user cannot join a private community"""
        self.assertTrue(self.login)
        community = CommunityMember(
            community=self.private_community, user=self.user_to_join_community, invitor=None)
        community.save()
        assertTrue(community.get_no_of_members == 0)
        response = self.client.post(
            '/join_community/', content_type='application/json', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 403)
        self.assertContains(response, "Authorization denied")

    def test_user_who_creates_a_community_automatically_becomes_a_member(self):
        """Test user who creates a community automatically becomes a member"""
        self.assertTrue(self.login)
        community = CommunityMember(community=self.private_community)
        community.save()
        assertTrue(community.get_no_of_members == 1)




class TestCreateCommuntity(StaticLiveServerTestCase):
    fixtures = ['users.json']

    def setUp(self):
        self.browser = webdriver.Firefox()
        self.browser.set_window_size(1400, 1000)
        self.browser.implicitly_wait(10)

    def tearDown(self):
        self.browser.quit()

    def test_can_create_community(self):
        self.browser.get(self.live_server_url)

        # logging in username and password
        username_field = self.browser.find_element_by_name('username')
        username_field.send_keys('lade')

        password_field = self.browser.find_element_by_name('password')
        password_field.send_keys('password')
        password_field.send_keys(Keys.RETURN)
        time.sleep(10)

        # username and password accepted
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Share', body.text)

        # View Create Community page
        create_community_buttons = self.browser.find_elements_by_id(
            'create-community')
        for button in create_community_buttons:
            if button.is_displayed():
                button.click()
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Create A New Community', body.text)

        # Create a new community
        self.browser.find_element_by_name('name').send_keys('A New community')
        self.browser.find_element_by_name(
            'description').send_keys('This is a new community')
        self.browser.find_element_by_name('private').send_keys(True)
        self.browser.find_element_by_name(
            'visibility').send_keys('None')
        self.browser.find_element_by_name('default_group_permissions').send_keys(
            'Send invites, Remove members')
        self.browser.find_element_by_id('community_submit').click()
        body = self.browser.find_element_by_tag_name('body')
        self.assertNotIn('Create A New Community', body.text)
