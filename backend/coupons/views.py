from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Coupon
from .serializers import CouponSerializer

class ValidateCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        amount_raw = request.data.get('amount')
        amount = float(amount_raw) if amount_raw is not None else None

        if not code:
            return Response({"error": "Please enter a coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
            today = timezone.now().date()

            if coupon.valid_from > today or coupon.valid_until < today:
                return Response({"error": "This coupon code has expired."}, status=status.HTTP_400_BAD_REQUEST)

            if amount is not None and amount < float(coupon.min_booking_amount):
                return Response({
                    "error": f"Minimum booking subtotal of ₹{coupon.min_booking_amount} required to apply code {code}."
                }, status=status.HTTP_400_BAD_REQUEST)

            discount_amount = 0.0
            if amount is not None:
                raw_discount = amount * (float(coupon.discount_percentage) / 100.0)
                discount_amount = min(raw_discount, float(coupon.max_discount_amount))

            return Response({
                "valid": True,
                "code": coupon.code,
                "discount_percentage": float(coupon.discount_percentage),
                "max_discount_amount": float(coupon.max_discount_amount),
                "min_booking_amount": float(coupon.min_booking_amount),
                "discount_amount": round(discount_amount, 2),
                "net_amount": round(max(0, amount - discount_amount), 2) if amount is not None else None,
                "message": f"Coupon {coupon.code} applied successfully! ({coupon.discount_percentage}% OFF)"
            }, status=status.HTTP_200_OK)

        except Coupon.DoesNotExist:
            return Response({"error": "Invalid promo coupon code."}, status=status.HTTP_404_NOT_FOUND)


class ActiveCouponsListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CouponSerializer

    def get_queryset(self):
        today = timezone.now().date()
        return Coupon.objects.filter(is_active=True, valid_from__lte=today, valid_until__gte=today).order_by('-discount_percentage')


class CouponListCreateView(generics.ListCreateAPIView):
    queryset = Coupon.objects.all().order_by('-id')
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        code = serializer.validated_data.get('code', '').upper()
        serializer.save(code=code)


class CouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]
