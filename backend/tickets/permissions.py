from rest_framework import permissions


class IsAgent(permissions.BasePermission):
    """Allows access only to support agents."""
    message = 'This action is restricted to support agents.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_agent)


class IsOwnerOrAgent(permissions.BasePermission):
    """
    Object-level permission: a customer may only access their own ticket.
    Agents may access any ticket.
    """
    message = "You do not have permission to access this ticket."

    def has_object_permission(self, request, view, obj):
        if request.user.is_agent:
            return True
        return obj.user_id == request.user.id


class IsCommentTicketOwnerOrAgent(permissions.BasePermission):
    """Same rule as above, applied to a comment's parent ticket."""
    message = "You do not have permission to access these comments."

    def has_object_permission(self, request, view, obj):
        ticket = obj.ticket if hasattr(obj, 'ticket') else obj
        if request.user.is_agent:
            return True
        return ticket.user_id == request.user.id
