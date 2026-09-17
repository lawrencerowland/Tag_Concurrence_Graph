import os
import shutil
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import build_static


def test_build_creates_docs(tmp_path):
    docs_dir = os.path.join(os.path.dirname(build_static.__file__), 'docs')
    if os.path.exists(docs_dir):
        for entry in os.scandir(docs_dir):
            if entry.name == '.gitkeep':
                continue
            if entry.is_dir():
                shutil.rmtree(entry.path)
            else:
                os.remove(entry.path)

    build_static.build()

    assert os.path.isdir(docs_dir)
    assert os.path.isfile(os.path.join(docs_dir, 'index.html'))
    assert os.path.isfile(os.path.join(docs_dir, 'complex.html'))
    assert os.path.isfile(os.path.join(docs_dir, 'pw_best.html'))
    assert os.path.isfile(os.path.join(docs_dir, 'portfolio_wave_best.json'))
    assert os.path.isfile(os.path.join(docs_dir, 'app_catalogue.html'))
    for name in ['index.html', 'complex.html', 'pw_best.html']:
        with open(os.path.join(docs_dir, name)) as page:
            assert 'href="app_catalogue.html"' in page.read()
    with open(os.path.join(docs_dir, 'app_catalogue.html')) as page:
        catalogue = page.read()
        for destination in ['index.html', 'complex.html', 'pw_best.html']:
            assert f'href="{destination}"' in catalogue
        metadata = build_static.verify_active_snapshot()
        assert f"{metadata['sourceAppCount']}-app React catalogue captured on {metadata['snapshotDate']}" in catalogue
        if metadata['snapshotDate'] == '2026-09-17':
            assert 'before three apps moved' in catalogue
    for asset in ['data/catalogue-view.json', 'data/react-catalogue-2026-09-17.csv', 'data/react-catalogue-2026-09-17.json', 'data/react-catalogue-2026-09-17.metadata.json', 'js/app-catalogue.js', 'js/catalogue-model.mjs', 'css/app-catalogue.css', 'vendor/cytoscape-3.32.1.min.js']:
        assert os.path.isfile(os.path.join(docs_dir, 'static', asset))


def test_new_snapshot_changes_page_copy_and_no_script_download():
    rendered = build_static.env.get_template('app_catalogue.html').render(catalogue={
        'sourceAppCount': 16, 'snapshotDate': '2026-09-18', 'snapshotFile': 'react-catalogue-2026-09-18.csv',
    })
    assert '16-app React catalogue captured on 2026-09-18' in rendered
    assert 'before three apps moved' not in rendered
    assert 'static/data/react-catalogue-2026-09-18.csv' in rendered
