from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from tickets.models import Ticket, TicketComment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with sample users, tickets and comments for demo/testing.'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('Users already exist — skipping seed to avoid duplicates.'))
            return

        alice = User.objects.create_user(
            username='alice', email='alice@example.com', password='Customer123',
            first_name='Alice', last_name='Johnson', role=User.Role.CUSTOMER,
        )
        bob = User.objects.create_user(
            username='bob', email='bob@example.com', password='Customer123',
            first_name='Bob', last_name='Martinez', role=User.Role.CUSTOMER,
        )
        priya = User.objects.create_user(
            username='priya', email='priya.agent@example.com', password='Agent123',
            first_name='Priya', last_name='Nair', role=User.Role.AGENT,
        )
        daniel = User.objects.create_user(
            username='daniel', email='daniel.agent@example.com', password='Agent123',
            first_name='Daniel', last_name='Kim', role=User.Role.AGENT,
        )

        t1 = Ticket.objects.create(
            user=alice, subject='Cannot reset my password',
            description='The reset link in the email leads to a 404 page.',
            priority=Ticket.Priority.HIGH, status=Ticket.Status.OPEN,
        )
        t2 = Ticket.objects.create(
            user=alice, subject='Invoice amount looks wrong',
            description='My March invoice charged me twice for the same plan.',
            priority=Ticket.Priority.MEDIUM, status=Ticket.Status.IN_PROGRESS, assigned_to=priya,
        )
        t3 = Ticket.objects.create(
            user=bob, subject='Feature request: dark mode',
            description='Would love a dark theme for the dashboard.',
            priority=Ticket.Priority.LOW, status=Ticket.Status.OPEN,
        )
        t4 = Ticket.objects.create(
            user=bob, subject='App crashes on file upload',
            description='Uploading a PDF over 5MB crashes the browser tab.',
            priority=Ticket.Priority.URGENT, status=Ticket.Status.IN_PROGRESS, assigned_to=daniel,
        )

        TicketComment.objects.create(ticket=t1, user=alice, comment='Tried again on Chrome and Safari, same result.')
        TicketComment.objects.create(ticket=t2, user=priya, comment='Looking into the billing system now, will update shortly.')
        TicketComment.objects.create(ticket=t2, user=alice, comment='Thank you, appreciate the quick response.')
        TicketComment.objects.create(ticket=t4, user=daniel, comment='Confirmed the crash. Escalating to engineering.')

        self.stdout.write(self.style.SUCCESS('Seed data created:'))
        self.stdout.write('  Customers: alice@example.com / Customer123, bob@example.com / Customer123')
        self.stdout.write('  Agents:    priya.agent@example.com / Agent123, daniel.agent@example.com / Agent123')
