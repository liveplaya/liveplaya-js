import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {Art} from '../mapdata';

export 
function renderPois(projection, container, features, city, style, onclick) {
    features = features.filter((f) => f.geometry && f.geometry.type == 'Point' && !f.tracked);

    const group = container.select('g.pois');
    const nodes = group.selectAll('circle').data(features);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('circle')
        .merge(nodes)
            .attr('fill', f => style.featureColor(f, style))
            .attr('stroke', null)
            .attr('cx', f => projection(f.coords)[0])
            .attr('cy', f => projection(f.coords)[1])
            .attr('r', 3)
            .on('click', onclick);
}
