import {select} from 'd3-selection';

export 
function renderPlayaBg(projection, container, style) {
    const boxes = !style.showRasterTilesOnPlaya ? [[projection([-119.3290, 40.8512]), projection([-119.1378, 40.7262])]] : [];
    const group = container.select('g.playabg');
    const nodes = group.selectAll('rect').data(boxes);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('rect')
            .attr('stroke', null)
        .merge(nodes)
            .attr('x', f => f[0][0])
            .attr('y', f => f[0][1])
            .attr('width', f => f[1][0] - f[0][0])
            .attr('height', f => f[1][1] - f[0][1])
            .attr('fill', style.backgroundColor);
}

