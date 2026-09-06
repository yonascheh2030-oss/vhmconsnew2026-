"""Auth helpers: bcrypt hashing + JWT tokens + admin seeding."""
import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import HTTPException

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 12


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessie verlopen, log opnieuw in.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ongeldig token.")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Ongeldig tokentype.")
    return payload


async def seed_admin(db):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@vhmconstructionrenovation.be").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Victor",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
    return admin_email
