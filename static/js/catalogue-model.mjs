export function elementsFromData(data, threshold) {
  const edges = data.edges.filter(edge => edge.weight >= threshold);
  const connected = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  return [
    ...data.nodes.filter(node => threshold === 0 || connected.has(node.id)).map(node => ({ data: { ...node } })),
    ...edges.map(edge => ({ data: { id: `pair:${JSON.stringify([edge.source, edge.target])}`, ...edge } })),
  ];
}
export function neighboursFor(data, id, threshold) {
  return data.edges.filter(edge => edge.weight >= threshold && (edge.source === id || edge.target === id))
    .map(edge => ({ id: edge.source === id ? edge.target : edge.source, weight: edge.weight }));
}
export function graphStyle(showLabels, maxWeight) {
  return [
    { selector: 'node', style: { label: showLabels ? 'data(id)' : '', width: maxWeight > 1 ? `mapData(weight, 1, ${maxWeight}, 24, 64)` : 28, height: maxWeight > 1 ? `mapData(weight, 1, ${maxWeight}, 24, 64)` : 28, 'background-color': '#397f73', 'font-size': 11, 'text-wrap': 'wrap', 'text-max-width': 100 } },
    { selector: 'edge', style: { width: 1.5, 'line-color': '#95aea8', 'curve-style': 'bezier' } },
    { selector: '.dim', style: { opacity: 0.16 } },
    { selector: '.highlight', style: { 'border-width': 3, 'border-color': '#aa541b', 'line-color': '#aa541b' } },
  ];
}
export function validateSnapshot(graph, metadata) {
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || metadata.snapshotStatus !== 'frozen'
    || graph.nodes.length !== metadata.nodeCount || graph.edges.length !== metadata.edgeCount
    || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.snapshotDate)) throw new Error('Invalid catalogue snapshot.');
  const ids = new Set(graph.nodes.map(node => node.id));
  if (ids.size !== graph.nodes.length || graph.nodes.some(node => typeof node.id !== 'string' || !Number.isInteger(node.weight) || node.weight < 1)
    || graph.edges.some(edge => !ids.has(edge.source) || !ids.has(edge.target) || !Number.isInteger(edge.weight) || edge.weight < 1)) throw new Error('Invalid tag graph.');
}
