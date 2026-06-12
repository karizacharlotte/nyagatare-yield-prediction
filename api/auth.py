"""JWT + password helpers for the farmer account system."""

import os
import datetime
from functools import wraps

import jwt
from flask import request, jsonify

from .models import User

JWT_SECRET     = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
JWT_ALGORITHM  = 'HS256'
JWT_EXPIRY_DAYS = 90


def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user():
    """Return the User for a valid Bearer token, or None."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[len('Bearer '):].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return User.query.get(payload.get('user_id'))


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return wrapper
