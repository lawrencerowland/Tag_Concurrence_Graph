# Tag Concurrence Graph

A small static web app for turning tagged document lists into concept graphs. Given a set of documents and their tags, the app treats each tag as a node and each shared document as evidence of a relationship between tags.

The original public note for the app is here: https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7261881256538173440

## What It Shows

The app is useful for three related intuitions:

1. Workflows and reading lists often contain hidden conceptual structure.
2. Tags that appear on the same document are likely to have a meaningful relationship.
3. Lightweight AI-assisted graph tools can expose a useful first map before heavier modelling work begins.

## Example Graphs

The repository includes two sample graph views:

- `index.html` shows Lawrence's reading list graph.
- `complex.html` visualizes a complex project management graph.

Each page links to the other in the sidebar so you can switch between them.

## Portfolio Wave Handoff

This repo is a strong receiver for Portfolio Wave metadata experiments. Use it when a DEVONthink group, vault source map, or working-directory foray has enough tagged source material to ask: "what concepts are clustering together, and which connections deserve a more deliberate model?"

A useful next Portfolio Wave increment would be to add one curated dataset from a `/best` source cluster, keeping three things together:

- the source documents or DEVONthink group that produced the tags;
- the generated tag-concurrence JSON file;
- a short note explaining what the graph clarifies, what it distorts, and which repo or foray should receive the next modelling step.

This keeps the app as an early mapping surface rather than a final ontology or project model.

## Data Prompt

To create a graph JSON file from a tagged document list, use a prompt like this:

> These are metadata rows for key documents. Each document has been tagged with several concepts. Run a concurrence algorithm over the tags and create a JSON file with node and edge lists. Each concurrent tag is a node. Node weight is the tag count. Each edge is a tag co-occurrence, and edge weight is the number of documents where the pair co-occurs. Use the JSON format shown by this app.

## Local Development

Install the Python dependencies, then run the tests or build the static site:

```bash
pip install -r requirements.txt
pytest
python build_static.py
```

The static site is generated into `docs/` for GitHub Pages. Do not edit generated `docs/` files directly; edit templates and static assets instead.

## Deployment

For tips on running this project on GitHub Pages, see [github-pages-deployment.md](github-pages-deployment.md).
