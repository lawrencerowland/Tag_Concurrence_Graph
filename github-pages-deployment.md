# Deploying the Tag Concurrence Graph on GitHub Pages

This project is now a purely static site rendered from Jinja2 templates. GitHub Pages serves the HTML, JavaScript and JSON files without any back‑end. Below are some notes on deploying and working with the site.

## 1. Static site generation

The HTML pages are produced by running `python build_static.py`, which renders the templates into the `docs/` folder. GitHub Pages is configured to publish that directory.

## 2. Use GitHub Actions to build the site

If you move the front‑end to a framework like React, you can use an action to build the production bundle and push it to the `gh-pages` branch. Typical steps:

1. In `.github/workflows/` create a workflow that installs Node, runs `npm install && npm run build`, and then deploys using the `actions/deploy-pages` action.
2. Configure GitHub Pages to serve the `gh-pages` branch.



## Environment setup

- Python dependencies are listed in `pyproject.toml`. Use Python 3.11 or later.
- To preview the site locally, run `python build_static.py` and then `python -m http.server` from the project root.

Choose the option that best fits the project goals. For a simple demo or personal site, converting everything to static files is often the quickest way to deploy on GitHub Pages.
