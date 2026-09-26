from django.contrib.auth import get_user_model
from django.db.models import Count

from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, TicketComment
from .filters import TicketFilter
from .permissions import IsAgent, IsOwnerOrAgent
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateSerializer,
    TicketCommentSerializer,
    MiniUserSerializer,
)

User = get_user_model()


class TicketViewSet(viewsets.ModelViewSet):
    """
    /api/tickets/          GET (list, scoped by role), POST (customer creates)
    /api/tickets/{id}/     GET, PUT/PATCH, DELETE
    /api/tickets/stats/    GET agent dashboard statistics
    """

    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = TicketFilter

    search_fields = [
        'subject',
        'description',
        'user__username',
        'user__email',
    ]

    ordering_fields = [
        'created_at',
        'updated_at',
        'priority',
        'status',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        qs = (
            Ticket.objects
            .select_related('user', 'assigned_to')
            .annotate(comment_count=Count('comments'))
        )

        # Agents can see all tickets.
        if user.is_agent:
            return qs

        # Customers can only see their own tickets.
        return qs.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer

        if self.action == 'create':
            return TicketCreateSerializer

        if self.action in ('update', 'partial_update'):
            return TicketUpdateSerializer

        return TicketDetailSerializer

    def get_permissions(self):
        # Statistics are agent-only.
        if self.action == 'stats':
            return [
                permissions.IsAuthenticated(),
                IsAgent(),
            ]

        # Only customers can create tickets.
        if self.action == 'create':
            return [
                permissions.IsAuthenticated(),
            ]

        # Only the ticket owner or an agent can access/manage
        # an individual ticket.
        if self.action in (
            'retrieve',
            'update',
            'partial_update',
            'destroy',
        ):
            return [
                permissions.IsAuthenticated(),
                IsOwnerOrAgent(),
            ]

        return [
            permissions.IsAuthenticated(),
        ]

    def create(self, request, *args, **kwargs):
        if request.user.is_agent:
            return Response(
                {
                    'detail': (
                        'Support agents cannot create tickets '
                        'on behalf of customers via this endpoint.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = serializer.save()

        return Response(
            TicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        # Customers have limited editing permissions.
        if not request.user.is_agent:

            # Customer can only edit an open ticket.
            if instance.status != Ticket.Status.OPEN:
                return Response(
                    {
                        'detail': (
                            'This ticket can no longer be edited '
                            'by the customer.'
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Customers may only change subject and description.
            allowed_fields = {
                'subject',
                'description',
            }

            if not set(request.data.keys()).issubset(allowed_fields):
                return Response(
                    {
                        'detail': (
                            'Customers may only update the '
                            'subject and description.'
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            TicketDetailSerializer(instance).data
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if (
            not request.user.is_agent
            and instance.user_id != request.user.id
        ):
            return Response(
                {'detail': 'Not allowed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[
            permissions.IsAuthenticated,
            IsAgent,
        ],
    )
    def stats(self, request):
        """Aggregate statistics for the agent dashboard."""

        qs = Ticket.objects.all()

        data = {
            'total': qs.count(),
            'open': qs.filter(
                status=Ticket.Status.OPEN
            ).count(),
            'in_progress': qs.filter(
                status=Ticket.Status.IN_PROGRESS
            ).count(),
            'resolved': qs.filter(
                status=Ticket.Status.RESOLVED
            ).count(),
            'closed': qs.filter(
                status=Ticket.Status.CLOSED
            ).count(),
            'urgent_open': qs.filter(
                status=Ticket.Status.OPEN,
                priority=Ticket.Priority.URGENT,
            ).count(),
            'unassigned': (
                qs.filter(assigned_to__isnull=True)
                .exclude(status=Ticket.Status.CLOSED)
                .count()
            ),
        }

        return Response(data)


class TicketCommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/tickets/{ticket_id}/comments
    POST /api/tickets/{ticket_id}/comments
    """

    serializer_class = TicketCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_ticket(self):
        from django.shortcuts import get_object_or_404
        from rest_framework.exceptions import PermissionDenied

        ticket = get_object_or_404(
            Ticket,
            pk=self.kwargs['ticket_id'],
        )

        user = self.request.user

        if not user.is_agent and ticket.user_id != user.id:
            raise PermissionDenied(
                'You do not have permission to access these comments.'
            )

        return ticket

    def get_queryset(self):
        ticket = self.get_ticket()

        return (
            TicketComment.objects
            .filter(ticket=ticket)
            .select_related('user')
        )

    def perform_create(self, serializer):
        ticket = self.get_ticket()

        serializer.save(
            ticket=ticket,
            user=self.request.user,
        )


class AgentListView(generics.ListAPIView):
    """
    GET /api/users

    List of support agents for ticket assignment.
    Agent-only endpoint.
    """

    serializer_class = MiniUserSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        IsAgent,
    ]

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.AGENT
        ).order_by('username')