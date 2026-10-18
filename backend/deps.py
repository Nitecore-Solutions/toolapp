from slowapi import Limiter
from slowapi.util import get_remote_address

# Limiter alag file mein — circular import se bachao
limiter = Limiter(key_func=get_remote_address)
