import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {Art} from '../mapdata';

export 
function renderPois(projection, container, features, style, onclick) {
    features = features.filter((f) => f.isPOI && (style.showArt || !f instanceof Art));

    const group = container.select('g.pois');
    const nodes = group.selectAll('circle').data(features);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('circle')
        .merge(nodes)
            .attr('fill', (f) => f.color ? f.color : style.outlineColor)
            .attr('stroke', 'none')
            .attr('cx', (f) => projection(f.center)[0])
            .attr('cy', (f) => projection(f.center)[1])
            .attr('r', 3)
            .on('click', onclick);
}
