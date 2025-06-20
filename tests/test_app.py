import os
import sys
import io
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

def test_index_route():
    with app.test_client() as client:
        resp = client.get('/')
        assert resp.status_code == 200



def test_network_route():
    with app.test_client() as client:
        resp = client.get('/api/network')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'nodes' in data and 'edges' in data


def test_export_route_download():
    with app.test_client() as client:
        payload = {
            'nodes': [{'data': {'id': 'A'}}],
            'edges': []
        }
        resp = client.post('/api/export', json=payload)
        assert resp.status_code == 200
        assert resp.headers['Content-Type'] == 'application/json'
        assert 'attachment;filename=network_export_' in resp.headers.get('Content-Disposition', '')
        exported = resp.get_json()
        assert exported['nodes'] == payload['nodes']
        assert exported['edges'] == payload['edges']


def test_upload_route_valid_and_invalid(tmp_path):
    valid_data = {'nodes': [{'id': 'A'}], 'edges': []}
    invalid_json = '{invalid}'
    graph_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tag_concurrence_graph.json')
    with open(graph_path, 'rb') as f:
        original = f.read()
    with app.test_client() as client:
        data = {
            'file': (io.BytesIO(json.dumps(valid_data).encode('utf-8')), 'valid.json')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200
        assert resp.get_json().get('message') == 'File uploaded successfully'

        bad = {
            'file': (io.BytesIO(invalid_json.encode('utf-8')), 'bad.json')
        }
        resp_bad = client.post('/api/upload', data=bad, content_type='multipart/form-data')
        assert resp_bad.status_code == 400
        assert 'error' in resp_bad.get_json()
    with open(graph_path, 'wb') as f:
        f.write(original)

