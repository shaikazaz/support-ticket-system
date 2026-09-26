from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Ticket, TicketComment

User = get_user_model()


class MiniUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']


class TicketCommentSerializer(serializers.ModelSerializer):
    user = MiniUserSerializer(read_only=True)

    class Meta:
        model = TicketComment
        fields = ['id', 'ticket', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'ticket', 'user', 'created_at']


class TicketListSerializer(serializers.ModelSerializer):
    """Lighter-weight serializer used for list views."""
    customer = MiniUserSerializer(source='user', read_only=True)
    assigned_to = MiniUserSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'priority', 'status', 'customer', 'assigned_to',
            'comment_count', 'created_at', 'updated_at',
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    customer = MiniUserSerializer(source='user', read_only=True)
    assigned_to = MiniUserSerializer(read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'description', 'priority', 'status', 'customer',
            'assigned_to', 'comments', 'created_at', 'updated_at',
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'subject', 'description', 'priority']

    def validate_subject(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Subject must be at least 5 characters long.')
        return value.strip()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return Ticket.objects.create(**validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Update rules enforced in the view/serializer:
    - Agents may change status, priority, assigned_to.
    - Customers may only edit subject/description while the ticket is still open,
      enforced in the view's get_serializer_class + object permission checks.
    """
    class Meta:
        model = Ticket
        fields = ['subject', 'description', 'priority', 'status', 'assigned_to']

    def validate_assigned_to(self, value):
        if value is not None and not value.is_agent:
            raise serializers.ValidationError('Tickets can only be assigned to support agents.')
        return value
