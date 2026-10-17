from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserProfileView,
    ChangePasswordView, ForgotPasswordView, ResetPasswordView,
    UserListView, UserBlockToggleView, UserRoleChangeView, UserDeleteView,
    CheckEmailView, SendOTPView, VerifyOTPView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('check-email/', CheckEmailView.as_view(), name='check_email'),
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('all/', UserListView.as_view(), name='user_list'),
    path('<int:pk>/toggle-block/', UserBlockToggleView.as_view(), name='toggle_block_user'),
    path('<int:pk>/change-role/', UserRoleChangeView.as_view(), name='change_user_role'),
    path('<int:pk>/delete/', UserDeleteView.as_view(), name='delete_user'),
]

