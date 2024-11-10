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
});
