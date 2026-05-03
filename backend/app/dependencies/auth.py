import base64
import json
from functools import lru_cache
from typing import Annotated

import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric.ec import (
    SECP256R1,
    EllipticCurvePublicNumbers,
)
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer = HTTPBearer()


def _b64_to_int(b64: str) -> int:
    """Decode a base64url-encoded coordinate to an integer."""
    padded = b64 + "=" * (4 - len(b64) % 4)
    return int.from_bytes(base64.urlsafe_b64decode(padded), "big")


@lru_cache(maxsize=1)
def _get_public_key():
    """Builds an EC public key from the JWK stored in settings."""
    jwk = json.loads(settings.supabase_jwt_jwk)
    x = _b64_to_int(jwk["x"])
    y = _b64_to_int(jwk["y"])
    public_numbers = EllipticCurvePublicNumbers(x=x, y=y, curve=SECP256R1())
    return public_numbers.public_key()


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """
    Validates the Supabase JWT (ES256) and returns the user's UUID (sub claim).
    Raises HTTP 401 on any validation failure.
    """
    token = credentials.credentials.strip()
    # Remove accidental "Bearer " prefix (e.g. when pasted with prefix in Swagger)
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    try:
        public_key = _get_public_key()
        payload = pyjwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta el campo 'sub'.",
            )
        return user_id
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token ha expirado.",
        )
    except pyjwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {e}",
        )


CurrentUser = Annotated[str, Depends(get_current_user_id)]
