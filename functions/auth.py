"""Lambda Function: パスワード検証 + HMAC署名cookie発行"""

import hashlib
import hmac
import json
import os
import time


def handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }

    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
    except (json.JSONDecodeError, TypeError):
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": "invalid request"}),
        }

    password = body.get("password", "")
    expected = os.environ.get("SITE_PASSWORD", "")

    if not expected or password != expected:
        return {
            "statusCode": 401,
            "headers": headers,
            "body": json.dumps({"error": "invalid password"}),
        }

    secret = os.environ.get("HMAC_SECRET", "default-secret")
    expires = int(time.time()) + 86400 * 30  # 30日
    message = f"music_auth:{expires}"
    sig = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

    cookie_value = f"{expires}.{sig}"
    domain = os.environ.get("COOKIE_DOMAIN", "")
    domain_part = f"; Domain={domain}" if domain else ""

    return {
        "statusCode": 200,
        "headers": {
            **headers,
            "Set-Cookie": f"music_auth={cookie_value}; Path=/; Secure; SameSite=Lax; Max-Age=2592000{domain_part}",
        },
        "body": json.dumps({"ok": True}),
    }
