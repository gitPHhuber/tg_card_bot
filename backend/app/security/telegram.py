import hashlib
import hmac
import json
from urllib.parse import parse_qs

from fastapi import Header, HTTPException

from app.config import settings


def verify_init_data(init_data: str) -> dict:
    parsed = parse_qs(init_data)

    check_hash = parsed.get("hash", [None])[0]
    if not check_hash:
        raise HTTPException(status_code=401, detail="Missing hash")

    data_pairs = []
    for key, values in sorted(parsed.items()):
        if key == "hash":
            continue
        data_pairs.append(f"{key}={values[0]}")

    data_check_string = "\n".join(data_pairs)

    secret_key = hmac.new(
        b"WebAppData", settings.bot_token.encode(), hashlib.sha256
    ).digest()
    computed_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, check_hash):
        raise HTTPException(status_code=401, detail="Invalid init data signature")

    user_data = parsed.get("user", [None])[0]
    if not user_data:
        raise HTTPException(status_code=401, detail="Missing user data")

    return json.loads(user_data)


async def get_telegram_user(
    x_telegram_init_data: str = Header(...),
) -> dict:
    return verify_init_data(x_telegram_init_data)
