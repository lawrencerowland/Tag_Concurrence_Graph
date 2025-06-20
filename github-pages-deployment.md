# Deploying the Tag Concurrence Graph on GitHub Pages

This repository was originally designed to run on Replit with a small Flask back‑end. GitHub Pages only serves static content, so the Flask server cannot run directly on Pages. Below are a few approaches to make the project available on GitHub Pages and suggestions for setting up the environment.

## 1. Convert to a purely static site

- Keep the `templates` and `static` directories, but adapt the code so that data loading and file uploads happen entirely in the browser using JavaScript.
- Store example JSON files (like `tag_concurrence_graph.json`) in the repository so they can be fetched directly via HTTP.
- Replace API routes (`/api/network`, `/api/upload`, `/api/export`) with equivalent client‑side logic. For instance, file uploads can be handled by reading the file in the browser and updating the visualization without sending it to a server.
- Once the app works without the Flask server, commit the static HTML/JS/CSS files in the root or a `docs` folder. GitHub Pages can serve files from the root of the `main` branch or from `/docs`.

## 2. Use GitHub Actions to build the site

If you move the front‑end to a framework like React, you can use an action to build the production bundle and push it to the `gh-pages` branch. Typical steps:

1. In `.github/workflows/` create a workflow that installs Node, runs `npm install && npm run build`, and then deploys using the `actions/deploy-pages` action.
2. Configure GitHub Pages to serve the `gh-pages` branch.

## 3. Host the Flask back‑end elsewhere

If server features are required, consider hosting the Flask app on a small cloud service (Render, Fly.io, etc.) and use GitHub Pages only for the front‑end files. Update the JavaScript to call the remote API.

## Environment setup

- Python dependencies are listed in `pyproject.toml`. Use Python 3.11 or later.
- For local development with Flask, run `python main.py` and visit `http://localhost:5000`.
- To serve the static version locally, you can use a simple HTTP server: `python -m http.server` from the directory containing `index.html`.

Choose the option that best fits the project goals. For a simple demo or personal site, converting everything to static files is often the quickest way to deploy on GitHub Pages.
