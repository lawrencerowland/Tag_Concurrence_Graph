let cy = null;
let originalData = null;

async function initializeGraph() {
    try {
        console.log("Starting graph initialization...");
        
        // Load network data
        const response = await fetch('/api/network');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        originalData = await response.json();
        
        // Verify data structure
        console.log("Received network data:", originalData);
        if (!originalData || !Array.isArray(originalData.nodes) || !Array.isArray(originalData.edges)) {
            throw new Error("Invalid data structure: missing nodes or edges arrays");
        }
        
        // Verify node and edge format
        const validNodeFormat = originalData.nodes.every(node => 
            node.data && typeof node.data.id === 'string');
        const validEdgeFormat = originalData.edges.every(edge => 
            edge.data && typeof edge.data.source === 'string' && typeof edge.data.target === 'string');
            
        if (!validNodeFormat || !validEdgeFormat) {
            throw new Error("Invalid data format: nodes must have {data: {id: string}}, edges must have {data: {source: string, target: string}}");
        }

        console.log("Data validation passed. Initializing Cytoscape...");

        // Initialize Cytoscape with error handling
        try {
            // Check if required extensions are loaded
            if (typeof cytoscape === 'undefined') {
                throw new Error("Cytoscape library not loaded");
            }
            if (typeof cytoscape('core', 'fcose') !== 'function') {
                throw new Error("FCose layout extension not loaded");
            }

            // Register the panzoom extension
            if (typeof cytoscape('core', 'panzoom') !== 'function') {
                console.log("Registering panzoom extension...");
                cytoscape.use(cytoscapePanzoom);
            }

            console.log("Creating Cytoscape instance with data:", originalData);

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
                    randomize: true,
                    nodeRepulsion: 8000,
                    idealEdgeLength: 100,
                    edgeElasticity: 0.45,
                    nestingFactor: 0.1,
                    gravity: 0.25,
                    numIter: 2500,
                    tile: true,
                    tilingPaddingVertical: 10,
                    tilingPaddingHorizontal: 10
                }
            });

            console.log("Cytoscape instance created successfully");

            // Initialize panzoom after cy is created
            cy.panzoom({
                zoomFactor: 0.05,
                zoomDelay: 45,
                minZoom: 0.1,
                maxZoom: 10,
                fitPadding: 50
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

        } catch (cytoscapeError) {
            console.error('Error initializing Cytoscape:', cytoscapeError);
            throw cytoscapeError;
        }

    } catch (error) {
        console.error('Error initializing graph:', error);
        const cyContainer = document.getElementById('cy');
        if (cyContainer) {
            cyContainer.innerHTML = `<div class="alert alert-danger">
                Error loading graph visualization: ${error.message}
                <br>Please check console for details and try refreshing the page.
            </div>`;
        }
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
