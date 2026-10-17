from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer
from .utils import check_and_create_stay_reminders

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        check_and_create_stay_reminders(user)
        return Notification.objects.filter(recipient=user).order_by('-created_at')

class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marked as read.", "is_read": True}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)

class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        check_and_create_stay_reminders(request.user)
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)

class SendTestNotificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.first()

        title = request.data.get('title', '🔔 GoOnStay Test Alert!')
        message = request.data.get(
            'message', 
            'Yeh test notification hai! Live stay alerts, reminders aur booking updates successfully work kar rahe hain. 🎉'
        )

        notification = None
        if user:
            notification = Notification.objects.create(
                recipient=user,
                title=title,
                message=message,
                notification_type=Notification.TYPE_GENERAL
            )

        return Response({
            "message": "Test notification created successfully!",
            "notification": NotificationSerializer(notification).data if notification else None,
            "title": title,
            "body": message
        }, status=status.HTTP_201_CREATED)
