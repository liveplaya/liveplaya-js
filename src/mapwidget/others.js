import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {path as pathBuilder} from 'd3-path';
import {geoPath} from 'd3-geo';
import {Fence} from '../mapdata';

export function renderOthers(projection, container, features, city, style, onclick) {
    features = features.filter((f) => !f.isRoad && !f.isPOI);

    const group = container.select('g.others');
    const geometryToPath = geoPath(projection);
    const nodes = group.selectAll('path').data(features);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('path')
        .merge(nodes)
            .each(function(f) {
                if (f instanceof Fence) {
                    select(this)
                        .attr('fill', 'none')
                        .attr('stroke', style.outlineColor)
                        .attr('stroke-width', 2)
                        .attr('stroke-dasharray', '5,4')
                        .attr('d', (f) => geometryToPath(f.geometry))
                        .on('click', onclick);
                }
                else {
                    select(this)
                        .attr('fill',  f => f.geometry && f.geometry.type == 'Point' ? style.mutedColor : 'none')
                        .attr('stroke', style.mutedColor)
                        .attr('stroke-width', 0.3)
                        .attr('d', (f) => geometryToPath(f.geometry))
                        .on('click', onclick);
                }
            });
}
