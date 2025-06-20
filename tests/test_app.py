import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

def test_index_route():
    with app.test_client() as client:
        resp = client.get('/')
        assert resp.status_code == 200


def test_upload_non_json_file():
    """Uploading a file without .json extension should fail."""
    from io import BytesIO

    with app.test_client() as client:
        data = {
            'file': (BytesIO(b'{}'), 'data.txt')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'Only JSON files are allowed'


def test_upload_valid_json_file(tmp_path):
    """Uploading a valid JSON file should succeed."""
    from io import BytesIO

    json_content = b'{"nodes": [], "edges": []}'

    with app.test_client() as client:
        data = {
            'file': (BytesIO(json_content), 'graph.json')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'File uploaded successfully'


def test_upload_json_uppercase_extension():
    """Uploading JSON file with uppercase extension should succeed."""
    from io import BytesIO

    json_content = b'{"nodes": [], "edges": []}'

    with app.test_client() as client:
        data = {
            'file': (BytesIO(json_content), 'graph.JSON')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'File uploaded successfully'


def test_upload_empty_filename():
    """Uploading with empty filename should fail."""
    from io import BytesIO

    with app.test_client() as client:
        data = {
            'file': (BytesIO(b'{}'), '')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'No file selected'

