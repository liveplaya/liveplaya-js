import {select} from 'd3-selection';
import {fromFeet, toDegrees} from '../math';
import {CStreet, TStreet, Marker} from '../mapdata';

export function renderLabels(projection, container, features, style, onclick) {
    const cstreets = features.filter((f) => f instanceof CStreet);
    const tstreets = features.filter((f) => f instanceof TStreet);
    const markers = features.filter((f) => f instanceof Marker);

    const tstreetLabels = tstreets.map((street) => { return {
        onclick: () => onclick(street),
        pt: projection(street.city.getLocation(street.direction, street.city.cstreets['L'].radius)),
        txt: street.name,
        ang: street.city.getBearing(street.direction.radians),
        off: [0,-15],
        anchor: 'middle',
        fontSize: 10,
        fontWeight: 'normal',
        stroke: 'none',
        strokeWidth: 0,
        fill: style.outlineColor,
    }});
    const cstreetLabels = cstreets.map((street) => { return {
        onclick: () => onclick(street),
        pt: projection(street.city.getLocation({hour:10, minute:0}, street.radius)),
        txt: street.name,
        ang: 0,
        off: [14,0],
        anchor: 'start',
        fontSize: 10,
        fontWeight: 'normal',
        stroke: 'none',
        strokeWidth: 0,
        fill: style.outlineColor,
    }});
    const markerLabels = markers.map((marker) => { return {
        onclick: () => onclick(marker),
        pt: projection(marker.coords),
        txt: marker.name,
        ang: 0,
        off: [0,-8],
        anchor: 'middle',
        fontSize: 12,
        fontWeight: 'bold',
        stroke: style.backgroundColor,
        strokeWidth: 7,
        fill: marker.color,
    }});

    const group = container.select('g.labels');    
    let nodes = group.selectAll("text").data([...cstreetLabels, ...tstreetLabels, ...markerLabels]);

    nodes.exit()
        .remove();

    nodes.enter()
        .append('text')
            .attr('font-family', 'Helvetica, sans-serif')
            .attr('paint-order', 'stroke')
            .style('cursor', 'default')
        .merge(nodes)
            .attr('stroke', (l) => l.stroke)
            .attr('stroke-width', (l) => l.strokeWidth)
            .attr('font-size', (l) => l.fontSize)
            .attr('font-weight', (l) => l.fontWeight)
            .attr('text-anchor', (l) => l.anchor)
            .attr('fill', (l) => l.fill)
            .attr('transform', (l) => 'translate(' + l.pt.join(',') + ') rotate(' + toDegrees(l.ang) + ') translate(' + l.off.join(',') + ')')    
            .style('user-select', (l) => l.selectable ? 'allowed' : 'none')
            .on('click', (l)=> l.onclick)
            .text((l) => l.txt);
}