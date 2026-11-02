import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL

    def send_notification(self, to_email: str, subject: str, body: str) -> bool:
        """
        Sends an email notification via configured SMTP server.
        Fails gracefully if credentials are not configured or network is blocked.
        """
        if not self.username or not self.password:
            print(f"[EmailService] Mock notification dispatched to {to_email}: {subject}")
            return True

        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(self.host, self.port, timeout=5)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            print(f"[EmailService] Sent email to {to_email}")
            return True
        except Exception as e:
            print(f"[EmailService] SMTP send error: {e}")
            return False

email_service = EmailService()
