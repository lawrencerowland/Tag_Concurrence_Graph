# Maintainer Guidelines

This repository contains a static site built from Jinja2 templates. Use `build_static.py` to render the final HTML into the `docs/` directory. When updating the site, follow these rules:

1. **Edit templates and static assets** only inside the `templates/` and `static/` directories. The static site is generated using `build_static.py`.
2. **Run tests** with `pytest` before committing. Add new tests in the `tests/` directory for any new functionality.
3. **Do not commit the generated `docs/` output**. The `docs` folder is produced in CI and ignored in git.
4. **GitHub Pages deployment** is handled by `.github/workflows/pages.yml`. Do not rename this workflow without updating the documentation.
5. Keep dependencies listed in `requirements.txt` and update `pyproject.toml` if new packages are required.

These conventions help keep the project easy to maintain and ensure the GitHub Pages deployment continues to work.
