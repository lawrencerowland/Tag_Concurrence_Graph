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
        
        cy.edges().forEach(edge => {
            const weight = edge.data('weight');
            edge.style('opacity', weight >= threshold ? 0.8 : 0);
        });
    });

    // Reset view button
    const resetViewBtn = document.getElementById('resetView');
    resetViewBtn.addEventListener('click', function() {
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
