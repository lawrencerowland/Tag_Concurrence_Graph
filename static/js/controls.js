document.addEventListener('DOMContentLoaded', function() {
    // Layout control
    const layoutSelect = document.getElementById('layoutSelect');
    layoutSelect.addEventListener('change', function() {
        const layout = cy.layout({
            name: this.value,
            animate: true,
            padding: 30,
            nodeDimensionsIncludeLabels: true
        });
        layout.run();
    });

    // Edge weight filter
    const edgeWeightFilter = document.getElementById('edgeWeightFilter');
    const weightValue = document.getElementById('weightValue');
    edgeWeightFilter.max = 5;  // Update max value to 5
    edgeWeightFilter.step = 0.5;  // Update step for better control
    
    edgeWeightFilter.addEventListener('input', function() {
        const threshold = parseFloat(this.value);
        weightValue.textContent = threshold;
        
        // Reset visibility
        cy.elements().style('opacity', 1);
        
        // Track nodes with edges above threshold
        const nodesWithValidEdges = new Set();
        
        // Process edges
        cy.edges().forEach(edge => {
            const weight = edge.data('weight');
            if (weight >= threshold) {
                edge.style('opacity', 0.8);
                nodesWithValidEdges.add(edge.source().id());
                nodesWithValidEdges.add(edge.target().id());
            } else {
                edge.style('opacity', 0);
            }
        });
        
        // Hide nodes with no valid edges
        cy.nodes().forEach(node => {
            if (!nodesWithValidEdges.has(node.id())) {
                node.style('opacity', 0);
            }
        });

        // Recalculate layout with current settings
        const layout = cy.layout({
            name: layoutSelect.value,
            animate: true,
            padding: 30,
            nodeDimensionsIncludeLabels: true
        });
        layout.run();
    });

    // Reset view button
    const resetViewBtn = document.getElementById('resetView');
    resetViewBtn.addEventListener('click', function() {
        cy.fit();
        cy.center();
        // Reset edge weight filter
        edgeWeightFilter.value = 0;
        weightValue.textContent = "0";
        cy.elements().style('opacity', 1);
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
});
