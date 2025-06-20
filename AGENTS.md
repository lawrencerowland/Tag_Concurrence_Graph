# Maintainer Guidelines

This repository contains a small Flask application that is converted to a static site for GitHub Pages. When updating the site, follow these rules:

1. **Edit templates and static assets** only inside the `templates/` and `static/` directories. The static site is generated using `build_static.py`.
2. **Run tests** with `pytest` before committing. Add new tests in the `tests/` directory for any new routes or logic.
3. **Do not commit the generated `docs/` output**. The `docs` folder is produced in CI and ignored in git.
4. **GitHub Pages deployment** is handled by `.github/workflows/pages.yml`. Do not rename this workflow without updating the documentation.
5. Keep dependencies listed in `requirements.txt` and update `pyproject.toml` if new packages are required.

These conventions help keep the project easy to maintain and ensure the GitHub Pages deployment continues to work.
