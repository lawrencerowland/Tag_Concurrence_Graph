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


def test_complex_dataset_has_nodes_and_edges():
    data = load_json('complex_project_management_graph.json')
    assert 'nodes' in data and 'edges' in data
    assert len(data['nodes']) > 0
