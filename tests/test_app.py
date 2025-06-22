import os
import sys
import io
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app


@pytest.fixture(autouse=True)
def preserve_dataset():
    """Ensure tag_concurrence_graph.json is restored after each test."""
    graph_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tag_concurrence_graph.json')
    with open(graph_path, 'rb') as f:
        original = f.read()
    yield
    with open(graph_path, 'wb') as f:
        f.write(original)


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
        
def test_upload_non_json_file():
    """Uploading a file without .json extension should fail."""
    with app.test_client() as client:
        data = {
            'file': (io.BytesIO(b'{}'), 'data.txt')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'Only JSON files are allowed'


def test_upload_valid_json_file():
    """Uploading a valid JSON file should succeed."""
    json_content = b'{"nodes": [], "edges": []}'
    with app.test_client() as client:
        data = {
            'file': (io.BytesIO(json_content), 'graph.json')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'File uploaded successfully'


def test_upload_json_uppercase_extension():
    """Uploading JSON file with uppercase extension should fail."""
    json_content = b'{"nodes": [], "edges": []}'
    with app.test_client() as client:
        data = {
            'file': (io.BytesIO(json_content), 'graph.JSON')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'Only JSON files are allowed'


def test_upload_empty_filename():
    """Uploading with empty filename should fail."""
    with app.test_client() as client:
        data = {
            'file': (io.BytesIO(b'{}'), '')
        }
        resp = client.post('/api/upload', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'No file selected'


def filter_graph_by_weight(data, threshold):
    """Replicate front-end filtering logic in Python."""
    node_ids = set()
    edges = []
    for edge in data['edges']:
        if edge['data'].get('weight', 1) >= threshold:
            edges.append(edge)
            node_ids.add(edge['data']['source'])
            node_ids.add(edge['data']['target'])
    nodes = [n for n in data['nodes'] if n['data']['id'] in node_ids]
    return {'nodes': nodes, 'edges': edges}


def test_filter_graph_by_weight():
    data = app.test_client().get('/api/network').get_json()
    original_edge_count = len(data['edges'])
    result = filter_graph_by_weight(data, 3)
    filtered_edges = result['edges']
    assert filtered_edges, 'Expected some edges after filtering'
    assert len(filtered_edges) < original_edge_count
    assert all(e['data']['weight'] >= 3 for e in filtered_edges)
    node_ids = {n['data']['id'] for n in result['nodes']}
    for e in filtered_edges:
        assert e['data']['source'] in node_ids
        assert e['data']['target'] in node_ids
