import hashlib
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.generate_catalogue import (
    DATA_DIR, canonical, create_snapshot, graph_from_csv, verify_active_snapshot,
)


def test_original_snapshot_is_reproducible_and_pinned():
    metadata = json.loads((DATA_DIR / 'react-catalogue-2026-09-17.metadata.json').read_text())
    assert (metadata['sourceAppCount'], metadata['nodeCount'], metadata['edgeCount']) == (19, 40, 58)
    assert metadata['sourceCommit'] == '12957f34702676f166f09dbb625d5c671c6dbac8'
    raw = (DATA_DIR / metadata['snapshotFile']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == '43f2c16370794d9f9d6ad668a791093cd83f398afafc888e02a4b0ff63aa72a2'
    expected, _ = graph_from_csv(raw)
    actual = json.loads((DATA_DIR / metadata['graphFile']).read_text())
    assert canonical(actual) == canonical(expected)


def test_selected_snapshot_passes_evidence_check():
    verify_active_snapshot()


def test_tags_count_once_per_app_and_pair_direction_is_irrelevant():
    graph, apps = graph_from_csv(b'#,name,tags\n1,Alpha,"b,a,a"\n2,Beta,"a,b,c"\n3,Gamma,z\n')
    assert graph['nodes'] == [
        {'id': 'a', 'weight': 2}, {'id': 'b', 'weight': 2},
        {'id': 'c', 'weight': 1}, {'id': 'z', 'weight': 1},
    ]
    assert graph['edges'] == [
        {'source': 'a', 'target': 'b', 'weight': 2},
        {'source': 'a', 'target': 'c', 'weight': 1},
        {'source': 'b', 'target': 'c', 'weight': 1},
    ]
    assert len(apps) == 3


@pytest.mark.parametrize('raw', [b'name,tags\nA,b\n', b'#,name,tags\n', b'#,name,tags\n1,,x\n', b'#,name,tags\n1,A\n', b'#,name,tags\n1,A,x,y\n'])
def test_invalid_catalogue_is_rejected(raw):
    with pytest.raises(ValueError):
        graph_from_csv(raw)


def test_new_snapshot_requires_explicit_activation_and_preserves_old_date(tmp_path):
    source = tmp_path / 'supplied.csv'
    target = tmp_path / 'data'
    source.write_text('#,name,tags\n1,Alpha,"a,b"\n')
    manifest = create_snapshot(source, '2026-09-17', target)
    assert not (target / 'catalogue-view.json').exists()
    create_snapshot(source, '2026-09-17', target, activate=True)
    original = {p.name: p.read_bytes() for p in target.iterdir()}
    create_snapshot(source, '2026-09-17', target, activate=True)
    assert {p.name: p.read_bytes() for p in target.iterdir()} == original
    assert verify_active_snapshot(target)['sourceAppCount'] == 1

    source.write_text('#,name,tags\n1,Alpha,a\n2,Beta,b\n')
    with pytest.raises(ValueError, match='different frozen snapshot'):
        create_snapshot(source, '2026-09-17', target, activate=True)
    create_snapshot(source, '2026-09-18', target)
    assert json.loads((target / 'catalogue-view.json').read_text()) == manifest
    create_snapshot(source, '2026-09-18', target, activate=True)
    assert verify_active_snapshot(target)['sourceAppCount'] == 2
    assert (target / 'react-catalogue-2026-09-17.csv').read_bytes() == original['react-catalogue-2026-09-17.csv']


@pytest.mark.parametrize('damage, message', [('csv', 'checksum'), ('graph', 'Graph differs'), ('metadata', 'provenance')])
def test_verification_rejects_changed_evidence(tmp_path, damage, message):
    source = tmp_path / 'supplied.csv'
    source.write_text('#,name,tags\n1,Alpha,"a,b"\n')
    target = tmp_path / 'data'
    manifest = create_snapshot(source, '2026-09-17', target, activate=True)
    if damage == 'csv':
        (target / 'react-catalogue-2026-09-17.csv').write_text('#,name,tags\n1,Changed,"a,b"\n')
    elif damage == 'graph':
        path = target / manifest['graph']
        graph = json.loads(path.read_text())
        graph['edges'][0]['weight'] = 2
        path.write_text(json.dumps(graph))
    else:
        path = target / manifest['metadata']
        metadata = json.loads(path.read_text())
        metadata['sourceAppCount'] = 2
        path.write_text(json.dumps(metadata))
    with pytest.raises(ValueError, match=message):
        verify_active_snapshot(target)
