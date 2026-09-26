import django_filters
from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    priority = django_filters.CharFilter(field_name='priority', lookup_expr='iexact')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to_id')
    unassigned = django_filters.BooleanFilter(field_name='assigned_to', lookup_expr='isnull')

    class Meta:
        model = Ticket
        fields = ['status', 'priority', 'assigned_to', 'unassigned']
