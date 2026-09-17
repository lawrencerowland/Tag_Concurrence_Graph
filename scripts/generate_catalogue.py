"""Generate a dated graph from an explicitly supplied catalogue; never fetch live data."""
import argparse
import csv
import hashlib
import io
import json
from collections import Counter
from datetime import date, datetime, timezone
from itertools import combinations
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / 'static' / 'data'


def graph_from_csv(raw):
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if not reader.fieldnames or not {'#', 'name', 'tags'}.issubset(reader.fieldnames):
        raise ValueError('Catalogue must contain #, name and tags columns.')
    nodes, pairs, apps = Counter(), Counter(), []
    for row in reader:
        if None in row or any(value is None for value in row.values()):
            raise ValueError('Malformed catalogue row.')
        if not row['name'].strip():
            raise ValueError('Every source row must name an app.')
        apps.append({'id': row['#'], 'name': row['name']})
        tags = sorted(set(tag.strip() for tag in row['tags'].split(',') if tag.strip()))
        nodes.update(tags)
        pairs.update(combinations(tags, 2))
    if not apps:
        raise ValueError('Catalogue has no apps.')
    graph = {
        'nodes': [{'id': tag, 'weight': weight} for tag, weight in sorted(nodes.items())],
        'edges': [{'source': source, 'target': target, 'weight': weight} for (source, target), weight in sorted(pairs.items())],
    }
    return graph, apps


def canonical(graph):
    return (sorted((node['id'], node['weight']) for node in graph['nodes']),
            sorted((tuple(sorted((edge['source'], edge['target']))), edge['weight']) for edge in graph['edges']))


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def create_snapshot(source, snapshot_date, output_dir=DATA_DIR, activate=False, source_url=None, source_commit=None):
    date.fromisoformat(snapshot_date)
    raw = Path(source).read_bytes()
    graph, apps = graph_from_csv(raw)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = 'react-catalogue-' + snapshot_date
    csv_path = output_dir / (stem + '.csv')
    graph_path = output_dir / (stem + '.json')
    meta_path = output_dir / (stem + '.metadata.json')
    if csv_path.exists():
        if csv_path.read_bytes() != raw:
            raise ValueError('This date already has a different frozen snapshot. Supply a new date.')
        # Preserve the capture record and exact graph bytes on repeat generation.
        if not graph_path.exists() or not meta_path.exists():
            raise ValueError('Existing snapshot is incomplete; inspect its provenance before repair.')
        if canonical(json.loads(graph_path.read_text())) != canonical(graph):
            raise ValueError('Existing graph does not match its frozen CSV.')
    else:
        if graph_path.exists() or meta_path.exists():
            raise ValueError('Snapshot files already exist without their CSV; inspect before repair.')
        csv_path.write_bytes(raw)
        write_json(graph_path, graph)
        metadata = {
            'schemaVersion': 1, 'title': 'React catalogue: frozen ' + snapshot_date + ' snapshot',
            'snapshotDate': snapshot_date, 'snapshotStatus': 'frozen',
            'sourceFile': Path(source).name, 'snapshotFile': csv_path.name, 'graphFile': graph_path.name,
            'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sourceAppCount': len(apps),
            'nodeCount': len(graph['nodes']), 'edgeCount': len(graph['edges']), 'sourceApps': apps,
            'refreshedAt': datetime.now(timezone.utc).isoformat(),
            'generator': 'scripts/generate_catalogue.py',
            'refreshCommand': 'python scripts/generate_catalogue.py --source <supplied-catalogue.csv> --date YYYY-MM-DD --activate',
            'refreshPolicy': 'Frozen supplied snapshot; no automatic fetch of the changing source catalogue.',
            'method': 'Each tag is counted once per app. Each pair counts apps carrying both tags; co-occurrence is not causation or a typed relation.',
        }
        if source_url:
            metadata['sourceUrl'] = source_url
        if source_commit:
            metadata['sourceCommit'] = source_commit
        write_json(meta_path, metadata)
    manifest = {'snapshotDate': snapshot_date, 'metadata': meta_path.name, 'graph': graph_path.name}
    if activate:
        write_json(output_dir / 'catalogue-view.json', manifest)
    return manifest


def verify_active_snapshot(output_dir=DATA_DIR):
    output_dir = Path(output_dir)
    manifest = json.loads((output_dir / 'catalogue-view.json').read_text())
    metadata = json.loads((output_dir / manifest['metadata']).read_text())
    raw = (output_dir / metadata['snapshotFile']).read_bytes()
    expected, apps = graph_from_csv(raw)
    actual = json.loads((output_dir / manifest['graph']).read_text())
    if metadata['sourceSha256'] != hashlib.sha256(raw).hexdigest():
        raise ValueError('Frozen catalogue checksum mismatch.')
    if canonical(actual) != canonical(expected):
        raise ValueError('Graph differs from the supplied catalogue snapshot.')
    if metadata['snapshotDate'] != manifest['snapshotDate'] or metadata['snapshotStatus'] != 'frozen' or metadata['graphFile'] != manifest['graph']:
        raise ValueError('Snapshot identity mismatch.')
    if metadata['sourceApps'] != apps or metadata['sourceAppCount'] != len(apps):
        raise ValueError('Source app provenance mismatch.')
    if metadata['nodeCount'] != len(expected['nodes']) or metadata['edgeCount'] != len(expected['edges']):
        raise ValueError('Graph count mismatch.')
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--source', type=Path, help='An explicitly supplied CSV; no download occurs.')
    parser.add_argument('--date', help='Snapshot date YYYY-MM-DD; existing dates are immutable.')
    parser.add_argument('--activate', action='store_true', help='Make this dated snapshot the maintained view.')
    parser.add_argument('--source-url')
    parser.add_argument('--source-commit')
    args = parser.parse_args()
    if args.check:
        if args.source or args.date or args.activate:
            parser.error('--check cannot be combined with generation options.')
        meta = verify_active_snapshot()
        print(f"Verified {meta['snapshotDate']}: {meta['sourceAppCount']} apps, {meta['nodeCount']} tags, {meta['edgeCount']} pairs.")
    else:
        if not args.source or not args.date:
            parser.error('Generation requires an explicit --source and --date.')
        print(json.dumps(create_snapshot(args.source, args.date, activate=args.activate, source_url=args.source_url, source_commit=args.source_commit)))


if __name__ == '__main__':
    main()
