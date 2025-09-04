from datetime import datetime, timedelta
from itsdangerous import TimestampSigner, BadSignature, SignatureExpired
from fastapi import Request


# Use a strong, unique key in production (e.g., from env)
SECRET_KEY = "change-me-please-very-secret"
COOKIE_NAME = "session"
COOKIE_MAX_AGE = 60 * 60 * 8 # 8 hours


signer = TimestampSigner(SECRET_KEY)


# --- Demo user store ---
USERS = {
# email: password (PLAINTEXT for demo only!)
"admin@example.com": "admin123",
}


def verify_credentials(email: str | None, password: str | None) -> bool:
    if not email or not password:
        return False
    real = USERS.get(email)
    return real is not None and real == password


def create_cookie_value(email: str) -> str:
    raw = f"{email}|{datetime.utcnow().isoformat()}"
    return signer.sign(raw.encode()).decode()


def read_cookie_value(value: str) -> str | None:
    try:
        unsigned = signer.unsign(value, max_age=COOKIE_MAX_AGE).decode()
        email, _issued_at = unsigned.split("|", 1)
        return email
    except (BadSignature, SignatureExpired, ValueError):
        return None

def current_user_email(request: Request) -> str | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    return read_cookie_value(token)