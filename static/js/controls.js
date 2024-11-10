document.addEventListener('DOMContentLoaded', function() {
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

            // Send data to server
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(exportData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Get the blob from the response
            const blob = await response.blob();
            
            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = response.headers.get('Content-Disposition').split('filename=')[1];
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting graph:', error);
            alert('Error exporting graph. Please try again.');
        }
    });
});
