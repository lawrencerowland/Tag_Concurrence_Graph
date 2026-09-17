import { elementsFromData, neighboursFor, graphStyle, validateSnapshot } from './catalogue-model.mjs';
const $ = id => document.getElementById(id);
let graph = { nodes: [], edges: [] }, cy = null, metadata = null;
let threshold = 0, labels = true, selectedId = '', loading = false;
function showError(message) { $('error-message').textContent = message; $('load-error').hidden = false; }
function updateSelection() {
  const info = $('selected-info'); info.replaceChildren();
  cy.elements().removeClass('dim highlight');
  $('tag-select').value = selectedId;
  $('clear-selection').hidden = !selectedId;
  if (!selectedId) return;
  const node = graph.nodes.find(value => value.id === selectedId);
  const mark = cy.getElementById(selectedId);
  if (!node || !mark.length) { selectedId = ''; $('tag-select').value = ''; $('clear-selection').hidden = true; return; }
  const group = mark.closedNeighborhood(); group.addClass('highlight'); cy.elements().difference(group).addClass('dim');
  const title = document.createElement('h2'); title.textContent = node.id;
  const count = document.createElement('p'); count.textContent = `Appears in ${node.weight} app${node.weight === 1 ? '' : 's'}.`;
  const list = document.createElement('ul');
  for (const neighbour of neighboursFor(graph, selectedId, threshold)) {
    const row = document.createElement('li'); row.textContent = `${neighbour.id}: ${neighbour.weight} shared app${neighbour.weight === 1 ? '' : 's'}`; list.append(row);
  }
  info.append(title, count, list);
}
function applyLayout() { cy.layout({ name: $('layout').value, animate: false, padding: 35, nodeDimensionsIncludeLabels: true }).run(); cy.fit(undefined, 35); }
function renderGraph() {
  const elements = elementsFromData(graph, threshold);
  cy.batch(() => { cy.elements().remove(); cy.add(elements); });
  const nodes = elements.filter(element => !('source' in element.data));
  const select = $('tag-select'); select.replaceChildren(new Option('Choose a tag', ''));
  for (const node of nodes) select.add(new Option(node.data.id, node.data.id));
  if (!nodes.some(node => node.data.id === selectedId)) selectedId = '';
  $('weight-value').textContent = threshold;
  $('count').textContent = `Showing ${nodes.length} tags and ${elements.length - nodes.length} connections.`;
  $('download').disabled = !nodes.length;
  $('tooltip').hidden = true;
  applyLayout(); updateSelection();
}
function appendLink(parent, label, href) { const link = document.createElement('a'); link.textContent = label; link.href = href; parent.append(link); }
function showProvenance(manifest) {
  const box = $('provenance'); box.replaceChildren();
  box.append(`Frozen ${metadata.snapshotDate}: ${metadata.sourceAppCount} apps · ${metadata.nodeCount} tags · ${metadata.edgeCount} tag pairs. `);
  appendLink(box, 'Snapshot CSV', `static/data/${metadata.snapshotFile}`); box.append(' · ');
  appendLink(box, 'Provenance metadata', `static/data/${manifest.metadata}`);
  if (metadata.sourceUrl) { box.append(' · '); appendLink(box, 'Pinned source catalogue', metadata.sourceUrl); }
  box.hidden = false;
}
async function load() {
  if (loading) return;
  loading = true; $('retry').disabled = true; $('load-error').hidden = true; $('load-status').hidden = false; $('load-status').textContent = 'Loading catalogue snapshot…';
  $('controls').disabled = true; $('tag-select').disabled = true;
  const read = async path => { const response = await fetch(path); if (!response.ok) throw new Error('File could not be loaded.'); return response.json(); };
  try {
    const manifest = await read('static/data/catalogue-view.json');
    const [data, provenance] = await Promise.all([read(`static/data/${manifest.graph}`), read(`static/data/${manifest.metadata}`)]);
    validateSnapshot(data, provenance);
    if (!window.cytoscape) throw new Error('Graph library unavailable.');
    graph = data; metadata = provenance; threshold = 0; selectedId = ''; labels = true;
    $('weight').value = '0'; $('weight').max = Math.max(10, ...graph.edges.map(edge => edge.weight)); $('labels').textContent = 'Hide Labels';
    if (cy) cy.destroy();
    cy = window.cytoscape({ container: $('catalogue-graph'), elements: [], style: graphStyle(labels, Math.max(1, ...graph.nodes.map(node => node.weight))), layout: { name: 'grid' } });
    cy.on('tap', 'node', event => { selectedId = event.target.id(); updateSelection(); });
    cy.on('mouseover mousemove', 'node', event => {
      const tip = $('tooltip'), position = event.renderedPosition || event.position;
      tip.textContent = event.target.id(); tip.style.left = `${position.x}px`; tip.style.top = `${position.y}px`; tip.hidden = false;
    });
    cy.on('mouseout', 'node', () => { $('tooltip').hidden = true; });
    showProvenance(manifest); renderGraph(); $('controls').disabled = false; $('tag-select').disabled = false;
  } catch (error) { showError('The catalogue graph could not be loaded. Try again.'); }
  finally { loading = false; $('retry').disabled = false; $('load-status').hidden = true; }
}
$('weight').addEventListener('input', event => { threshold = Number(event.target.value); renderGraph(); });
$('layout').addEventListener('change', applyLayout);
$('tag-select').addEventListener('change', event => { selectedId = event.target.value; updateSelection(); });
$('clear-selection').addEventListener('click', () => { selectedId = ''; updateSelection(); });
$('labels').addEventListener('click', () => {
  labels = !labels; $('labels').textContent = labels ? 'Hide Labels' : 'Show Labels';
  cy.style(graphStyle(labels, Math.max(1, ...graph.nodes.map(node => node.weight)))); updateSelection();
});
$('reset-view').addEventListener('click', () => { selectedId = ''; threshold = 0; $('weight').value = '0'; renderGraph(); });
$('download').addEventListener('click', () => {
  try {
    const link = document.createElement('a'); link.href = cy.png({ full: true, bg: 'white' }); link.download = `tag-concurrence-${metadata.snapshotDate}.png`; link.click();
  } catch (error) { showError('PNG export failed. Try again after the graph has finished laying out.'); }
});
$('retry').addEventListener('click', load);
window.addEventListener('resize', () => { if (cy) { cy.resize(); cy.fit(undefined, 35); } });
load();
