import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { elementsFromData, neighboursFor, graphStyle, validateSnapshot } from '../static/js/catalogue-model.mjs';

const read = file => JSON.parse(readFileSync(new URL(`../static/data/${file}`, import.meta.url)));
const graph = read('react-catalogue-2026-09-17.json');
const metadata = read('react-catalogue-2026-09-17.metadata.json');
const cytoscape = createRequire(import.meta.url)('../static/vendor/cytoscape-3.32.1.min.js');

test('initial snapshot retains 40 tags, 58 pairs, and isolated tags if supplied', () => {
  validateSnapshot(graph, metadata);
  const all = elementsFromData(graph, 0);
  assert.equal(all.length, 98);
  assert.equal(all.filter(item => !('source' in item.data)).length, 40);
  const withIsolated = { ...graph, nodes: [...graph.nodes, { id: 'isolated', weight: 1 }] };
  assert.equal(elementsFromData(withIsolated, 0).length, 99);
  assert.equal(elementsFromData(withIsolated, 1).length, 98);
});

test('threshold two keeps only the five supported tags and four pairs', () => {
  const filtered = elementsFromData(graph, 2);
  assert.equal(filtered.filter(item => !('source' in item.data)).length, 5);
  assert.equal(filtered.filter(item => 'source' in item.data).length, 4);
  assert.equal(elementsFromData(graph, 100).length, 0);
});

test('neighbour inspection uses only edges visible at the chosen threshold', () => {
  for (const node of graph.nodes) {
    const neighbours = neighboursFor(graph, node.id, 2);
    assert.ok(neighbours.every(item => item.weight >= 2));
    assert.equal(neighbours.length, graph.edges.filter(edge => edge.weight >= 2 && [edge.source, edge.target].includes(node.id)).length);
  }
  assert.equal(graph.nodes.find(node => node.id === 'knowledge_graph').weight, 4);
});

test('node size preserves app frequency and label toggle changes displayed text', t => {
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: elementsFromData(graph, 0), style: graphStyle(true, Math.max(...graph.nodes.map(node => node.weight))) });
  t.after(() => cy.destroy());
  const small = cy.nodes().filter(node => node.data('weight') === 1)[0];
  const large = cy.getElementById('knowledge_graph');
  assert.ok(large.width() > small.width());
  assert.equal(large.style('label'), 'knowledge_graph');
  cy.style(graphStyle(false, Math.max(...graph.nodes.map(node => node.weight))));
  assert.equal(large.style('label'), '');
});

for (const layout of ['grid', 'concentric', 'cose']) {
  test(`${layout} is included in the vendored library and lays out the snapshot`, () => {
    const cy = cytoscape({ headless: true, elements: elementsFromData(graph, 0) });
    cy.layout({ name: layout, animate: false, randomize: false }).run();
    assert.equal(cy.nodes().length, 40);
    assert.ok(cy.nodes().every(node => Number.isFinite(node.position('x')) && Number.isFinite(node.position('y'))));
    cy.destroy();
  });
}

test('malformed or unlabelled snapshots fail before graph initialization', () => {
  assert.throws(() => validateSnapshot(graph, { ...metadata, snapshotStatus: 'live' }));
  assert.throws(() => validateSnapshot(graph, { ...metadata, nodeCount: 39 }));
  assert.throws(() => validateSnapshot({ ...graph, edges: [{ source: 'missing', target: 'also missing', weight: 1 }] }, { ...metadata, edgeCount: 1 }));
});
