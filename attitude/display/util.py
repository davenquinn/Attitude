import json
from base64 import b64encode
from io import BytesIO

# For python 3 compatibility
try:
    from urllib.parse import quote
except ImportError:
    from urllib import quote


def encode(fig):
    b = BytesIO()
    fig.savefig(b, format="png", bbox_inches="tight")
    b.seek(0)
    return '<img src ="{},{}"/>'.format(
        "data:image/png;base64", quote(b64encode(b.read()))
    )


def to_json(value):
    """A filter that outputs Python objects as JSON"""
    return json.dumps(value)
