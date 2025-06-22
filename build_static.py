import os
import shutil
from jinja2 import Environment, FileSystemLoader

APP_ROOT = os.path.dirname(os.path.abspath(__file__))

env = Environment(loader=FileSystemLoader(os.path.join(APP_ROOT, 'templates')))


def build():
    """Render templates to the docs directory for GitHub Pages."""
    output_dir = os.path.join(APP_ROOT, 'docs')
    os.makedirs(output_dir, exist_ok=True)

    # Render each HTML template that should be available in the static site
    for template_name in ['index.html', 'complex.html']:
        template = env.get_template(template_name)
        rendered = template.render()
        out_path = os.path.join(output_dir, template_name)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(rendered)

    # Copy static files
    static_src = os.path.join(APP_ROOT, 'static')
    if os.path.isdir(static_src):
        shutil.copytree(
            static_src,
            os.path.join(output_dir, 'static'),
            dirs_exist_ok=True,
        )

    # Copy example JSON datasets
    for fname in ['tag_concurrence_graph.json', 'complex_project_management_graph.json']:
        src = os.path.join(APP_ROOT, fname)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(output_dir, fname))


if __name__ == '__main__':
    build()
    print('Static site generated in ./docs')
