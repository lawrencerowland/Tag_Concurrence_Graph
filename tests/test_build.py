import os
import shutil
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import build_static


def test_build_creates_docs(tmp_path):
    docs_dir = os.path.join(os.path.dirname(build_static.__file__), 'docs')
    if os.path.exists(docs_dir):
        shutil.rmtree(docs_dir)

    build_static.build()

    assert os.path.isdir(docs_dir)
    assert os.path.isfile(os.path.join(docs_dir, 'index.html'))
    assert os.path.isfile(os.path.join(docs_dir, 'complex.html'))
