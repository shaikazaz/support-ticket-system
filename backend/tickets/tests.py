from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from .models import Ticket

User = get_user_model()


class TicketTests(APITestCase):

    def setUp(self):
        self.customer1 = User.objects.create_user(
            username='cust1',
            email='cust1@example.com',
            password='Pass1234',
            role=User.Role.CUSTOMER,
        )

        self.customer2 = User.objects.create_user(
            username='cust2',
            email='cust2@example.com',
            password='Pass1234',
            role=User.Role.CUSTOMER,
        )

        self.agent = User.objects.create_user(
            username='agent1',
            email='agent1@example.com',
            password='Pass1234',
            role=User.Role.AGENT,
        )

        self.ticket = Ticket.objects.create(
            user=self.customer1,
            subject='Cannot log in to my account',
            description='Getting a 500 error.',
            priority=Ticket.Priority.HIGH,
        )

        self.tickets_url = reverse('ticket-list')

    def auth(self, user):
        self.client.force_authenticate(user=user)

    # ---------------------------------------------------------
    # Creation
    # ---------------------------------------------------------

    def test_ticket_creation_succeeds_for_customer(self):
        self.auth(self.customer1)

        payload = {
            'subject': 'Printer not working',
            'description': 'Office printer is offline.',
            'priority': 'low',
        }

        response = self.client.post(
            self.tickets_url,
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Ticket.objects.filter(
                user=self.customer1
            ).count(),
            2,
        )

    def test_agent_cannot_create_ticket(self):
        self.auth(self.agent)

        payload = {
            'subject': 'Should not be allowed',
            'description': 'Agents do not file tickets.',
            'priority': 'low',
        }

        response = self.client.post(
            self.tickets_url,
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ---------------------------------------------------------
    # Access control
    # ---------------------------------------------------------

    def test_unauthorized_user_cannot_access_protected_data(self):
        response = self.client.get(self.tickets_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_access_another_customers_ticket(self):
        self.auth(self.customer2)

        url = reverse(
            'ticket-detail',
            args=[self.ticket.id],
        )

        response = self.client.get(url)

        # Other customers' tickets are excluded from the
        # customer's queryset, so DRF returns 404.
        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_customer_sees_only_their_own_tickets_in_list(self):
        self.auth(self.customer2)

        response = self.client.get(self.tickets_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data['count'],
            0,
        )

    def test_agent_can_view_any_ticket(self):
        self.auth(self.agent)

        url = reverse(
            'ticket-detail',
            args=[self.ticket.id],
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    # ---------------------------------------------------------
    # Agent actions
    # ---------------------------------------------------------

    def test_agent_can_update_ticket_status(self):
        self.auth(self.agent)

        url = reverse(
            'ticket-detail',
            args=[self.ticket.id],
        )

        response = self.client.patch(
            url,
            {'status': 'in_progress'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.ticket.refresh_from_db()

        self.assertEqual(
            self.ticket.status,
            'in_progress',
        )

    def test_agent_can_assign_ticket(self):
        self.auth(self.agent)

        url = reverse(
            'ticket-detail',
            args=[self.ticket.id],
        )

        response = self.client.patch(
            url,
            {'assigned_to': self.agent.id},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.ticket.refresh_from_db()

        self.assertEqual(
            self.ticket.assigned_to_id,
            self.agent.id,
        )

    def test_customer_cannot_change_status(self):
        self.auth(self.customer1)

        url = reverse(
            'ticket-detail',
            args=[self.ticket.id],
        )

        response = self.client.patch(
            url,
            {'status': 'closed'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ---------------------------------------------------------
    # Not found / invalid
    # ---------------------------------------------------------

    def test_invalid_ticket_id_returns_404(self):
        self.auth(self.agent)

        url = reverse(
            'ticket-detail',
            args=[99999],
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_invalid_priority_rejected(self):
        self.auth(self.customer1)

        payload = {
            'subject': 'Valid subject line',
            'description': 'desc',
            'priority': 'not-a-real-priority',
        }

        response = self.client.post(
            self.tickets_url,
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # Comments
    # ---------------------------------------------------------

    def test_customer_can_add_comment_to_own_ticket(self):
        self.auth(self.customer1)

        url = reverse(
            'ticket-comments',
            args=[self.ticket.id],
        )

        response = self.client.post(
            url,
            {'comment': 'Any update on this?'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_customer_cannot_comment_on_others_ticket(self):
        self.auth(self.customer2)

        url = reverse(
            'ticket-comments',
            args=[self.ticket.id],
        )

        response = self.client.post(
            url,
            {'comment': 'Trying to snoop'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    def test_agent_stats_endpoint(self):
        self.auth(self.agent)

        response = self.client.get(
            reverse('ticket-stats')
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            'total',
            response.data,
        )

    def test_customer_forbidden_from_stats_endpoint(self):
        self.auth(self.customer1)

        response = self.client.get(
            reverse('ticket-stats')
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )