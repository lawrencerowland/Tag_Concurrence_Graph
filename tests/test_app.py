import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

def test_index_route():
    with app.test_client() as client:
        resp = client.get('/')
        assert resp.status_code == 200

