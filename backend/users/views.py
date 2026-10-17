import uuid
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer,
    UserProfileUpdateSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Allow login by email or username
        user_obj = User.objects.filter(email=username).first() or User.objects.filter(username=username).first()
        if user_obj:
            username = user_obj.username

        user = authenticate(username=username, password=password)

        if not user:
            return Response({"error": "Invalid username/email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_blocked:
            return Response({"error": "Your account has been blocked by the Administrator."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "message": "Login successful."
        }, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        new_key_id = request.data.get('razorpay_key_id')
        new_key_secret = request.data.get('razorpay_key_secret')
        
        key_id_changed = new_key_id is not None and new_key_id != (user.razorpay_key_id or '')
        key_secret_changed = new_key_secret is not None and new_key_secret != (user.razorpay_key_secret or '')
        
        if key_id_changed or key_secret_changed:
            current_password = request.data.get('current_password') or request.data.get('password')
            if not current_password:
                return Response(
                    {"error": "Security Verification Required: Please enter your current account password to update Razorpay Merchant Keys."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not user.check_password(current_password):
                return Response(
                    {"error": "Security Verification Failed: Incorrect account password provided."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().update(request, *args, **kwargs)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()

        if user:
            token = uuid.uuid4().hex
            user.reset_token = token
            user.reset_token_expires = timezone.now() + timedelta(hours=1)
            user.save()
            return Response({
                "message": "Password reset token generated.",
                "reset_token": token
            }, status=status.HTTP_200_OK)

        return Response({"message": "If that email exists in our system, a reset instructions token was generated."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        user = User.objects.filter(reset_token=token, reset_token_expires__gt=timezone.now()).first()
        if not user:
            return Response({"error": "Invalid or expired password reset token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        user.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class UserBlockToggleView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                return Response({"error": "Cannot block superuser."}, status=status.HTTP_400_BAD_REQUEST)
            user.is_blocked = not user.is_blocked
            user.save()
            status_text = "blocked" if user.is_blocked else "unblocked"
            return Response({"message": f"User {user.username} has been {status_text}.", "is_blocked": user.is_blocked})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class UserRoleChangeView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        role = request.data.get('role')
        valid_roles = [r[0] for r in User.ROLE_CHOICES]
        if role not in valid_roles:
            return Response({"error": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=pk)
            user.role = role
            user.save()
            return Response({"message": f"User {user.username}'s role changed to {role}.", "role": user.role})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class UserDeleteView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                return Response({"error": "Cannot delete superuser account."}, status=status.HTTP_400_BAD_REQUEST)
            username = user.username
            user.delete()
            return Response({"message": f"User account '{username}' deleted permanently."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class CheckEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get('email', '').strip()
        if not email:
            return Response({"exists": False}, status=status.HTTP_200_OK)
        
        exists = User.objects.filter(email__iexact=email).exists()
        return Response({
            "exists": exists,
            "message": "An account with this email address is already registered. Please sign in or use a different email address." if exists else "Email is available."
        }, status=status.HTTP_200_OK)


from util.otp import generate_otp, hash_otp
from services.email_service import send_otp_email
from .models import EmailOTP

class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_otp()
        otp_hashed = hash_otp(otp)

        # Invalidate old unverified OTPs for this email
        EmailOTP.objects.filter(email__iexact=email, is_verified=False).delete()

        # Save new OTP record
        EmailOTP.objects.create(email=email.lower(), otp_hash=otp_hashed)

        # Send email via SMTP / Email Service
        sent = send_otp_email(email, otp)

        return Response({
            "message": f"Verification OTP sent to {email}.",
            "email": email,
            "mail_sent": sent
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({"error": "Both email and 6-digit OTP code are required."}, status=status.HTTP_400_BAD_REQUEST)

        otp_hashed = hash_otp(otp)
        record = EmailOTP.objects.filter(email__iexact=email).first()

        if not record:
            return Response({"error": "No OTP requested for this email. Please click 'Send OTP' first."}, status=status.HTTP_400_BAD_REQUEST)

        if record.is_expired():
            return Response({"error": "OTP has expired (valid for 5 mins). Please request a new verification code."}, status=status.HTTP_400_BAD_REQUEST)

        if record.otp_hash != otp_hashed:
            return Response({"error": "Invalid 6-digit OTP code. Please check and try again."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as verified
        record.is_verified = True
        record.save()

        # If user account already exists, update is_email_verified
        user = User.objects.filter(email__iexact=email).first()
        if user:
            user.is_email_verified = True
            user.save()

        return Response({
            "message": "Email address verified successfully!",
            "is_verified": True,
            "email": email
        }, status=status.HTTP_200_OK)

