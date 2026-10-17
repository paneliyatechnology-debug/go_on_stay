from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'dob', 'avatar', 'bio',
            'preferred_language', 'preferred_currency', 'is_email_verified',
            'is_blocked', 'is_staff', 'is_superuser',
            'razorpay_key_id', 'razorpay_key_secret',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_blocked', 'is_email_verified', 'created_at', 'updated_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone_number',
            'dob', 'preferred_language', 'preferred_currency',
            'razorpay_key_id', 'razorpay_key_secret'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        
        # Don't allow creating admin or super admin via public registration
        if attrs.get('role') in [User.ROLE_ADMIN, User.ROLE_SUPER_ADMIN]:
            attrs['role'] = User.ROLE_CUSTOMER

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.is_email_verified = True
        user.save()
        return user

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'email', 'phone_number', 'dob',
            'avatar', 'bio', 'preferred_language', 'preferred_currency',
            'razorpay_key_id', 'razorpay_key_secret'
        )

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
