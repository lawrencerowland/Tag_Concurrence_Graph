import json
import os

def load_json(filename):
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_primary_dataset_has_nodes_and_edges():
    data = load_json('tag_concurrence_graph.json')
    assert 'nodes' in data and 'edges' in data
    assert len(data['nodes']) > 0
    assert len(data['edges']) > 0

def test_complex_dataset_has_nodes_and_edges():
    data = load_json('complex_project_management_graph.json')
    assert 'nodes' in data and 'edges' in data
    assert len(data['nodes']) > 0
    assert len(data['edges']) > 0

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
