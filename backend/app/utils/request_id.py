import random
import string
import time


def generate_request_code() -> str:
    """
    Generate a unique human-readable request code.
    Format: MF-{BASE36_TIMESTAMP}-{4DIGIT_RANDOM}
    Example: MF-M9KQ4X-5823
    """
    ts = int(time.time())
    base36_chars = string.digits + string.ascii_uppercase
    b36 = ""
    n = ts
    while n:
        n, r = divmod(n, 36)
        b36 = base36_chars[r] + b36
    suffix = str(random.randint(1000, 9999))
    return f"MF-{b36[-6:]}-{suffix}"
