// Update only the edge styling section where the warning occurs
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
                        'label': 'data(id)',
                        'color': '#fff',
                        'font-size': '12px',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'width': 30,
                        'height': 30,
                        'border-width': 2,
                        'border-color': '#fff'
                    }
                },
                {
                    selector: 'node[weight > 0]',
                    style: {
                        'width': 'mapData(weight, 1, 23, 30, 80)',
                        'height': 'mapData(weight, 1, 23, 30, 80)',
                        'font-size': 'mapData(weight, 1, 23, 12, 18)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(weight, 1, 5, 3, 12)',
                        'line-color': function(ele) {
                            const weight = ele.data('weight');
                            const minWeight = 1;
                            const maxWeight = 5;
                            const t = (weight - minWeight) / (maxWeight - minWeight);
                            
                            // Ensure RGB values are within valid range (0-255)
                            const startColor = [73, 80, 87];    // #495057
                            const endColor = [13, 110, 253];   // #0d6efd
                            
                            const r = Math.max(0, Math.min(255, Math.round(startColor[0] + t * (endColor[0] - startColor[0]))));
                            const g = Math.max(0, Math.min(255, Math.round(startColor[1] + t * (endColor[1] - startColor[1]))));
                            const b = Math.max(0, Math.min(255, Math.round(startColor[2] + t * (endColor[2] - startColor[2]))));
                            
                            return `rgb(${r},${g},${b})`;
                        },
                        'curve-style': 'bezier',
                        'opacity': 'mapData(weight, 1, 5, 0.6, 1)',
                        'target-arrow-shape': 'none'
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'border-color': '#0d6efd',
                        'border-width': 3,
                        'line-color': '#0d6efd',
                        'target-arrow-color': '#0d6efd',
                        'opacity': 1
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'border-color': '#0d6efd',
                        'border-width': 3,
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
                padding: 100,
                randomize: false,
                nodeRepulsion: function(node) {
                    return 8000 + (node.degree() * 500);
                },
                idealEdgeLength: 150,
                edgeElasticity: 0.45,
                nestingFactor: 0.1,
                gravity: 0.25,
                numIter: 2500,
                tile: true,
                tilingPaddingVertical: 10,
                tilingPaddingHorizontal: 10,
                gravityRangeCompound: 1.5,
                gravityCompound: 1.0,
                gravityRange: 3.8,
                componentSpacing: 100
            }
        });

        // Initialize panzoom
        if (typeof cy.panzoom === 'function') {
            cy.panzoom();
        }

        // Color nodes by their connectivity patterns
        const communities = cy.elements().components();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9FA8DA', '#CE93D8'];

        communities.forEach((component, index) => {
            component.nodes().style({
                'background-color': colors[index % colors.length]
            });
        });

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
    neighborhood.nodes().style('border-color', '#0d6efd');
    neighborhood.nodes().style('border-width', 3);
}

function resetHighlighting() {
    cy.elements().removeClass('highlighted');
    cy.elements().style('opacity', '1');
    cy.nodes().style('border-width', 2);
    cy.nodes().style('border-color', '#fff');
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
