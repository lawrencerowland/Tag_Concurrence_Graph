// Helper to fetch a dataset from a static JSON file.  If the file uses the
// "raw" format (nodes with id/weight fields and edges with source/target), it
// is converted to the Cytoscape element format expected by the graph code.
async function fetchDataset(name) {
    const fileName = name === 'lawrence'
        ? 'tag_concurrence_graph.json'
        : 'complex_project_management_graph.json';

    const resp = await fetch(fileName);
    if (!resp.ok) {
        throw new Error(`Failed to load dataset: ${fileName}`);
    }

    const data = await resp.json();

    // Detect raw format by checking for the absence of the "data" wrapper
    if (data.nodes && data.nodes.length && !data.nodes[0].data) {
        return {
            nodes: data.nodes.map(n => ({
                data: { id: n.id, weight: n.weight }
            })),
            edges: data.edges.map(e => ({
                data: {
                    id: `${e.source}-${e.target}`,
                    source: e.source,
                    target: e.target,
                    weight: e.weight
                }
            }))
        };
    }

    return data;
}

document.addEventListener('DOMContentLoaded', async function() {
    const datasetButtons = document.querySelectorAll('[data-dataset]');
    const defaultDataset = document.body.dataset.defaultDataset || 'lawrence';

    // Wait for Cytoscape initialization
    while (!cy) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async function loadDataset(name) {
        console.log('Loading dataset:', name);
        try {
            originalData = await fetchDataset(name);
            console.log('Loaded dataset with nodes:', originalData.nodes.length);
        } catch (err) {
            console.error('Failed to load dataset:', err);
            alert('Failed to load dataset. Please ensure the JSON files are present.');
            return;
        }

        cy.elements().remove();
        cy.add(originalData);

        applyLayout();
        applyCommunityStyling();

        document.querySelector('#weightButtons button[data-weight="0"]').click();
    }

    try {
        if (datasetButtons.length) {
            datasetButtons.forEach(btn => btn.classList.remove('active'));
            const defaultButton = document.querySelector(`[data-dataset="${defaultDataset}"]`);
            if (defaultButton) {
                defaultButton.classList.add('active');
            }
        }

        await loadDataset(defaultDataset);
    } catch (error) {
        console.error('Error initializing graph:', error);
    }

    // Dataset switcher (only if buttons exist)
    if (datasetButtons.length) {
        datasetButtons.forEach(button => {
            button.addEventListener('click', async function() {
                datasetButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                try {
                    await loadDataset(this.dataset.dataset);
                } catch (error) {
                    console.error('Error loading dataset:', error);
                    alert('Error loading dataset. Please try again.');
                }
            });
        });
    }

    function applyLayout() {
        const currentLayout = document.getElementById('layoutSelect').value;
        cy.layout({
            name: currentLayout,
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
            numIter: 2500,
            tile: true,
            tilingPaddingVertical: 10,
            tilingPaddingHorizontal: 10,
            gravityRangeCompound: 1.5,
            gravityCompound: 1.0,
            gravityRange: 3.8,
            componentSpacing: 100
        }).run();
    }

    function applyCommunityStyling() {
        const communities = cy.elements().components();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9FA8DA', '#CE93D8'];
        communities.forEach((component, index) => {
            component.nodes().style({
                'background-color': colors[index % colors.length]
            });
        });
    }

    // Layout control
    const layoutSelect = document.getElementById('layoutSelect');
    layoutSelect.addEventListener('change', function() {
        if (this.value === 'grid') {
            // Sort nodes by weight and edge weight
            const sortedNodes = cy.nodes().sort((a, b) => {
                const weightDiff = b.data('weight') - a.data('weight');
                if (weightDiff !== 0) return weightDiff;
                
                // For nodes with same weight, compare total edge weights
                const aEdgeWeight = a.connectedEdges().reduce((sum, edge) => sum + edge.data('weight'), 0);
                const bEdgeWeight = b.connectedEdges().reduce((sum, edge) => sum + edge.data('weight'), 0);
                return bEdgeWeight - aEdgeWeight;
            });

            const layout = cy.layout({
                name: 'grid',
                animate: true,
                padding: 30,
                nodeDimensionsIncludeLabels: true,
                sort: function(a, b) {
                    // Use pre-calculated sort order
                    return sortedNodes.indexOf(a) - sortedNodes.indexOf(b);
                },
                cols: Math.ceil(Math.sqrt(cy.nodes().length)) // Square-ish grid
            });
            layout.run();
        } else {
            const layout = cy.layout({
                name: this.value,
                animate: true,
                padding: 30,
                nodeDimensionsIncludeLabels: true
            });
            layout.run();
        }
    });

    // Edge weight filter buttons
    const weightButtons = document.querySelectorAll('#weightButtons button');
    weightButtons.forEach(button => {
        button.addEventListener('click', function() {
            const threshold = parseFloat(this.dataset.weight);
            
            // Update active button state
            weightButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Clear existing elements and create filtered graph
            cy.elements().remove();
            const filteredElements = filterGraphByWeight(threshold);
            cy.add(filteredElements);
            
            // Apply layout to filtered graph
            cy.layout({
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
            }).run();
        });
    });

    function filterGraphByWeight(threshold) {
        const filteredElements = {nodes: new Set(), edges: []};
        
        // Filter edges and collect valid nodes
        originalData.edges.forEach(edge => {
            if (edge.data.weight >= threshold) {
                filteredElements.edges.push(edge);
                filteredElements.nodes.add(edge.data.source);
                filteredElements.nodes.add(edge.data.target);
            }
        });
        
        // Create node objects for valid nodes
        const nodes = Array.from(filteredElements.nodes).map(nodeId => {
            const originalNode = originalData.nodes.find(n => n.data.id === nodeId);
            return originalNode;
        });
        
        return [...nodes, ...filteredElements.edges];
    }

    // Reset view button
    const resetViewBtn = document.getElementById('resetView');
    resetViewBtn.addEventListener('click', function() {
        // Reset active button
        weightButtons.forEach(btn => btn.classList.remove('active'));
        weightButtons[0].classList.add('active');
        
        // Restore full graph
        cy.elements().remove();
        cy.add(originalData);
        
        // Reset view
        cy.fit();
        cy.center();
    });

    // Toggle labels button
    const toggleLabelsBtn = document.getElementById('toggleLabels');
    let labelsVisible = true;
    toggleLabelsBtn.addEventListener('click', function() {
        labelsVisible = !labelsVisible;
        cy.style()
            .selector('node')
            .style('label', labelsVisible ? 'data(id)' : '')
            .update();
    });

    // Export functionality
    const exportBtn = document.getElementById('exportGraph');
    exportBtn.addEventListener('click', async function() {
        try {
            // Get current filter weight
            const activeWeightBtn = document.querySelector('#weightButtons button.active');
            const currentWeight = parseFloat(activeWeightBtn.dataset.weight);
            
            // Get current layout
            const currentLayout = layoutSelect.value;
            
            // Prepare export data
            const exportData = {
                nodes: cy.nodes().map(node => ({
                    data: {
                        id: node.id(),
                        weight: node.data('weight')
                    }
                })),
                edges: cy.edges().map(edge => ({
                    data: {
                        source: edge.source().id(),
                        target: edge.target().id(),
                        weight: edge.data('weight')
                    }
                })),
                filter_weight: currentWeight,
                layout: currentLayout
            };

            // Create a Blob locally instead of sending to the server
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Generate filename with timestamp
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `network_export_${ts}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting graph:', error);
            alert('Error exporting graph. Please try again.');
        }
    });

    // File upload functionality disabled
});
