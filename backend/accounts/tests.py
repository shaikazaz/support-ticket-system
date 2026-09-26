from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.valid_payload = {
            'username': 'janedoe',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'email': 'jane@example.com',
            'password': 'StrongPass123',
            'password_confirm': 'StrongPass123',
        }

    def test_customer_registration_succeeds(self):
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().role, User.Role.CUSTOMER)

    def test_registration_fails_on_password_mismatch(self):
        payload = {**self.valid_payload, 'password_confirm': 'Different123'}
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_login_succeeds(self):
        self.client.post(self.register_url, self.valid_payload, format='json')
        response = self.client.post(
            self.login_url, {'email': 'jane@example.com', 'password': 'StrongPass123'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_invalid_password_is_rejected(self):
        self.client.post(self.register_url, self.valid_payload, format='json')
        response = self.client.post(
            self.login_url, {'email': 'jane@example.com', 'password': 'WrongPassword'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
