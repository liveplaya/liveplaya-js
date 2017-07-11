import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {path as pathBuilder} from 'd3-path';
import {geoPath} from 'd3-geo';
import {fromFeet, toDegrees} from '../math';
import {toPixels, toZoom} from '../util';


function renderPaths(projection, features, group, weight, color, onClick) {
    const geometryToPath = geoPath(projection);
    const nodes = group.selectAll('path').data(features);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('path')
        .merge(nodes)
            .attr('fill', (f) => f.geometry.type == 'Polygon' ? color : 'none')
            .attr('stroke', color)
            .attr('stroke-width', (f) => f.width ? toPixels(projection, f.width) + weight : weight)
            .attr('d', (f) => geometryToPath(f.geometry))
            .on('click', onClick);
}


export function renderRoads(projection, container, features, style, onClick) {
    const roadFeatures = features.filter((f) => f.isRoad);
    renderPaths(projection, roadFeatures, container.select('g.outlines'), 10, style.outlineColor, onClick);
    renderPaths(projection, roadFeatures, container.select('g.fills'), 7, style.backgroundColor, onClick);
}
