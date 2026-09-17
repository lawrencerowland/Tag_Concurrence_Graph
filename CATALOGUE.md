# Maintained app-catalogue view

`app_catalogue.html` presents the React app catalogue as tag co-occurrence data alongside this site's document graphs. Its source is `templates/app_catalogue.html`, `static/js/app-catalogue.js`, `static/js/catalogue-model.mjs` and `static/css/app-catalogue.css`. The regular Jinja build renders the page; no compiled React bundle is maintained here.

## Frozen source evidence

The initial view preserves the **19 apps, 40 tags and 58 tag pairs captured on 17 September 2026**, before three apps moved out of the React collection. The current React catalogue can change independently. This graph does not claim to describe that changing catalogue.

- Supplied CSV: [`static/data/react-catalogue-2026-09-17.csv`](static/data/react-catalogue-2026-09-17.csv)
- Graph: [`static/data/react-catalogue-2026-09-17.json`](static/data/react-catalogue-2026-09-17.json)
- Provenance: [`static/data/react-catalogue-2026-09-17.metadata.json`](static/data/react-catalogue-2026-09-17.metadata.json)
- Pinned original catalogue: [React release `12957f3`](https://github.com/lawrencerowland/React_proj-apps/blob/12957f34702676f166f09dbb625d5c671c6dbac8/app-index.csv)
- CSV SHA-256: `43f2c16370794d9f9d6ad668a791093cd83f398afafc888e02a4b0ff63aa72a2`

Each tag counts once per app. Each unordered pair counts apps carrying both tags. Node size encodes the tag's app count. Thresholds filter edges and, above zero, remove tags without a retained edge. Neighbour inspection follows the visible edges. Cose, concentric and grid layouts, labels, pan/zoom and PNG export are preserved from the repaired source explorer. A tag co-occurrence is not evidence of causation, a typed relationship or an automatically discovered community.

The reading-list, project-management and Portfolio Wave datasets remain separate and unchanged. Their pages link to this view, which links back to each of them.

## Verify or refresh

The generator uses Python's standard library. It reads an **explicitly supplied CSV** with `#`, `name` and `tags` columns; it never downloads the current source catalogue. Comma-separated tag lists must be CSV quoted.

```sh
python scripts/generate_catalogue.py --check
```

For a new catalogue snapshot, supply a new date. Generate and review its CSV, graph and provenance before activating it:

```sh
python scripts/generate_catalogue.py --source /path/to/supplied-catalogue.csv --date YYYY-MM-DD --source-url https://github.com/OWNER/REPO/blob/COMMIT/app-index.csv --source-commit COMMIT
python scripts/generate_catalogue.py --source /path/to/supplied-catalogue.csv --date YYYY-MM-DD --activate
```

Repeat generation of the same dated bytes preserves the capture record. A different CSV cannot overwrite an existing date. `--activate` changes `static/data/catalogue-view.json`; old snapshots remain available. The page's counts, date, links and navigation are rendered from the active metadata. A new snapshot must be reviewed and committed together with that manifest. Supplying a newer date does not certify that its source is complete or correct.

`build_static.py` recomputes and checks the active graph, source checksum, app list and counts before rendering. Generated `docs/` output is ignored and must not be committed.

```sh
pytest
node --test tests/catalogue_model.test.mjs
python build_static.py
```

The JavaScript tests use Node 22 or later with no npm dependencies. The vendored Cytoscape 3.32.1 library and MIT licence are in `static/vendor/`. Browser review should cover all three layouts, threshold 2 (five tags/four pairs for the initial snapshot), `knowledge_graph` (four source apps), label toggling, PNG export, loading/retry, links back to existing views and a narrow screen.
