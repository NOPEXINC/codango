from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.keys import Keys


class CreateResource(StaticLiveServerTestCase):
    fixtures = ['users.json']

    def setUp(self):
        self.browser = webdriver.Firefox()
        self.browser.set_window_size(1400, 1000)
        self.browser.implicitly_wait(10)

    def tearDown(self):
        self.browser.quit()

    def test_can_create_resource(self):
        self.browser.get(self.live_server_url)

        # open login modal
        self.browser.find_element_by_css_selector('button[role="login"]') \
            .click()

        # logging in username and password
        username_field = self.browser.find_element_by_name('username')
        username_field.send_keys('lade')

        password_field = self.browser.find_element_by_name('password')
        password_field.send_keys('password')
        password_field.send_keys(Keys.RETURN)

        # creating a resource
        input_field = self.browser.find_element_by_id('id-plain-text')
        input_field.send_keys('This is a post')
        self.browser.find_element_by_xpath(
            "//button[contains(text(),'Share')]").click()
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Successfully', body.text)
