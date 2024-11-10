let cy = null;
let originalData = null;

async function initializeGraph() {
    try {
        console.log("Starting graph initialization...");
        const response = await fetch('/api/network');
        originalData = await response.json();
        console.log("Received network data:", originalData);

        // Initialize Cytoscape
        cy = cytoscape({
            container: document.getElementById('cy'),
            elements: originalData,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#6c757d',
                        'label': 'data(id)',
                        'color': '#fff',
                        'font-size': '12px',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'width': 30,
                        'height': 30
                    }
                },
                {
                    selector: 'node[weight > 0]',
                    style: {
                        'width': 'mapData(weight, 1, 10, 30, 60)',
                        'height': 'mapData(weight, 1, 10, 30, 60)',
                        'font-size': 'mapData(weight, 1, 10, 12, 16)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(weight, 1, 5, 2, 8)',
                        'line-color': '#6ea8fe',
                        'curve-style': 'bezier',
                        'opacity': 0.8,
                        'target-arrow-shape': 'none'
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'background-color': '#0d6efd',
                        'line-color': '#0d6efd',
                        'target-arrow-color': '#0d6efd',
                        'opacity': 1
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'background-color': '#198754',
                        'line-color': '#198754',
                        'opacity': 1
                    }
                }
            ],
            layout: {
                name: 'fcose',
                quality: 'proof',
                animate: true,
                animationDuration: 1000,
                nodeDimensionsIncludeLabels: true,
                padding: 50,
                randomize: false,
                nodeRepulsion: 8000,
                idealEdgeLength: 100,
                edgeElasticity: 0.45,
                nestingFactor: 0.1,
                gravity: 0.25,
                numIter: 2500
            }
        });

        // Initialize panzoom with default settings after Cytoscape instance is created
        if (typeof cy.panzoom === 'function') {
            cy.panzoom();
        }

        // Event handlers
        cy.on('tap', 'node', function(evt) {
            const node = evt.target;
            highlightNeighbors(node);
            updateNodeInfo(node);
        });

        cy.on('tap', function(evt) {
            if (evt.target === cy) {
                resetHighlighting();
                clearNodeInfo();
            }
        });

        // Fit the graph to the viewport after layout is done
        cy.on('layoutstop', function() {
            cy.fit();
        });

    } catch (error) {
        console.error('Error initializing graph:', error);
    }
}

function highlightNeighbors(node) {
    resetHighlighting();
    const neighborhood = node.neighborhood().add(node);
    neighborhood.addClass('highlighted');
    cy.elements().difference(neighborhood).style('opacity', '0.2');
}

function resetHighlighting() {
    cy.elements().removeClass('highlighted');
    cy.elements().style('opacity', '1');
}

function updateNodeInfo(node) {
    const nodeInfo = document.getElementById('nodeInfo');
    const neighbors = node.neighborhood('node');
    const edges = node.connectedEdges();
    const weight = node.data('weight') || 0;
    
    nodeInfo.innerHTML = `
        <p><strong>Tag:</strong> ${node.id()}</p>
        <p><strong>Weight:</strong> ${weight}</p>
        <p><strong>Connections:</strong> ${neighbors.length}</p>
        <p><strong>Connected Tags:</strong></p>
        <ul class="list-unstyled">
            ${neighbors.map(n => {
                const edge = edges.filter(e => e.source().id() === n.id() || e.target().id() === n.id())[0];
                return `<li>${n.id()} (weight: ${edge.data('weight')})</li>`;
            }).join('')}
        </ul>
    `;
}

function clearNodeInfo() {
    const nodeInfo = document.getElementById('nodeInfo');
    nodeInfo.innerHTML = '<p>Click a node to see details</p>';
}

// Initialize the graph when the page loads
document.addEventListener('DOMContentLoaded', initializeGraph);
