# Razorpay Integration Setup & Operations Manual

This guide details the exact steps required to configure, test, and deploy the Razorpay Payment Gateway integration for the **Book My Room** vacation rental & hotel marketplace.

---

## 1. Create a Razorpay Account
1. Visit [https://razorpay.com](https://razorpay.com) and click **Sign Up**.
2. Complete business registration and submit KYC documents for activate live payment processing.
3. Access your [Razorpay Dashboard](https://dashboard.razorpay.com/).

---

## 2. Obtain API Keys
1. In the Razorpay Dashboard, navigate to **Account & Settings** → **API Keys**.
2. For initial testing, switch the top toggle to **Test Mode**.
3. Click **Generate Test Key** to create:
   - `Key ID` (Format: `rzp_test_xxxxxxxxxxxxxx`)
   - `Key Secret` (Format: `xxxxxxxxxxxxxxxxxxxxxxxx`)
4. Download and securely store these credentials.

---

## 3. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory and update the following settings:

```env
# Payment Gateway Configuration
PAYMENT_MODE=test

# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

> **IMPORTANT**:
> - Never commit `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to version control.
> - Only `RAZORPAY_KEY_ID` is exposed to the frontend browser application via standard DRF endpoints.

---

## 4. Webhook Configuration
Webhooks allow Razorpay to notify the server asynchronously regarding offline payment captures, authorizations, and refunds.

### Webhook Endpoint URL
```
POST https://yourdomain.com/api/payments/webhook/
```
*(For local testing with webhooks, use ngrok: `ngrok http 8000` and set `https://<ngrok-id>.ngrok-free.app/api/payments/webhook/`)*

### Configured Webhook Events
In **Dashboard → Settings → Webhooks → Add New Webhook**, select the following mandatory events:
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`
- `refund.created`
- `refund.processed`
- `refund.failed`

Enter a strong random secret into **Secret** and copy it to `RAZORPAY_WEBHOOK_SECRET` in your `.env`.

---

## 5. Security Architecture & Verification Flow

```
Customer Booking Request
       │
       ▼
1. Backend creates Pending Booking & Razorpay Order (Paise conversion: ₹ * 100)
       │
       ▼
2. Frontend opens Razorpay Checkout SDK Modal
       │
       ▼
3. Customer completes Payment on Razorpay
       │
       ▼
4. Frontend posts razorpay_order_id, razorpay_payment_id, razorpay_signature to /api/payments/verify/
       │
       ▼
5. Backend verifies HMAC SHA256 Signature using RAZORPAY_KEY_SECRET
       │
       ▼
6. Backend verifies Amount & Currency directly with Razorpay API
       │
       ▼
7. Atomic DB Transaction locks booking, updates status to CONFIRMED, records Payment CAPTURED, and credits Host Earnings Ledger.
```

---

## 6. Testing in Test Mode
Use the official Razorpay Test Cards during checkout:

| Card Type | Card Number | Expiry | CVV | OTP |
|---|---|---|---|---|
| Domestic Success Card | `4111 1111 1111 1111` | `12/30` | `123` | Any 6-digit OTP |
| Domestic Failure Card | `4000 0000 0000 0002` | `12/30` | `123` | Fail option |

Automated Django backend test suite can be run via:
```bash
python manage.py test payments
```

---

## 7. Switch to Live Credentials
Before switching live:
1. Complete KYC Verification on the Razorpay Dashboard.
2. In Razorpay Dashboard, toggle mode to **Live Mode**.
3. Generate **Live API Key & Secret** (`rzp_live_...`).
4. In `backend/.env`:
   ```env
   PAYMENT_MODE=live
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=live_webhook_secret_here
   ```
5. Restart your backend server.

---

## 8. Production Security Checklist
- [x] HTTPS enforced on all API endpoints
- [x] Live Razorpay credentials configured in environment variables
- [x] Secret keys excluded from git & frontend bundles
- [x] Server-side HMAC SHA256 signature verification enabled
- [x] Server-side price recalculation in integer paise (`₹ * 100`)
- [x] Duplicate payment and webhook replay protection active (Idempotency)
- [x] Atomic DB transactions (`@transaction.atomic` with `select_for_update`)
- [x] Webhook raw body signature verification active
- [x] Host Earnings Ledger separated from direct payouts
- [x] Refund & retry endpoints tested and operational
