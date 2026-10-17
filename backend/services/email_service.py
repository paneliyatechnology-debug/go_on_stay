import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_otp_email(receiver_email, otp):

    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")

    message = EmailMessage()

    message["Subject"] = "GoOnStay - Your Email Verification OTP"
    message["From"] = sender_email
    message["To"] = receiver_email

    message.set_content(
        f"""
Hello,

Your email verification OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this OTP, please ignore this email.

Regards,
GoOnStay Team
"""
    )

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(sender_email, sender_password)
        smtp.send_message(message)