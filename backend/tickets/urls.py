from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketCommentListCreateView, AgentListView

router = DefaultRouter()
router.register('tickets', TicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('tickets/<int:ticket_id>/comments', TicketCommentListCreateView.as_view(), name='ticket-comments'),
    path('users', AgentListView.as_view(), name='agent-list'),
]
