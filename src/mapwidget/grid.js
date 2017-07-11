import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {range} from 'd3-array';
import {fromFeet} from '../math';
import {toPixels} from '../util';
import {firstCity} from '../mapdata';

export function renderGrid(projection, container, features, style) {
    const city = firstCity(features);
    let radials = [];
    if (style.showGrid && city) {
        const center = projection(city.center);
        // const ticks = scaleLinear()
        //     .domain([0, city.fence.radius])
        //     .ticks(10)

        radials = range(0, 10000, fromFeet(100)).map((r) => [toPixels(projection,r), ...center]);
    }
    const group = container.select('g.grid')
        .attr('fill', 'none')
        .attr('stroke-width', '0.2px')
        .attr('stroke', style.mutedColor);
    
    let nodes = group.selectAll("circle").data(radials);

    nodes.exit()
        .remove();

    nodes.enter()
        .append('circle')
        .merge(nodes)
            .attr('r', (d) => d[0])
            .attr('cx', (d) => d[1])
            .attr('cy', (d) => d[2]);
}

