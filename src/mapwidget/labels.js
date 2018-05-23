import {select} from 'd3-selection';
import rbush from 'rbush';
import {fromFeet, toDegrees} from '../math';

function bbox(label) {
    const width = label.txt.length * label.fontSize * 0.7;
    const height = label.fontSize;
    const xoff = label.anchor == 'middle' ? -width/2 : 0;
    const yoff = -label.fontSize;
    const x =  label.pt[0] + label.off[0] + xoff;
    const y =  label.pt[1] + label.off[1] + yoff;
    return {x, y, width, height};
}

export function renderLabels(projection, container, features, city, style, onclick) {
    let labels = [];
    if (style.showLabels) {
        const cstreets = features.filter(f => f.streetKind == 'cstreet');
        const tstreets = features.filter(f => f.stretKind == 'tstreat');
        const pois = features.filter((f) => f.geometry && f.geometry.type == 'Point' && !f.tracked);

        const tstreetLabels = tstreets.map((street) => { return {
            onclick: () => onclick(street),
            pt: projection(street.city.getLocation(street.direction, street.city.lStreet.radius)),
            txt: street.name,
            ang: street.city.getBearing(street.direction.radians),
            off: [0,-15],
            anchor: 'middle',
            alignment: 'auto',
            fontSize: style.secondaryFontSize,
            fontWeight: 'normal',
            stroke: 'none',
            strokeWidth: 0,
            fill: style.outlineColor,
            selectable: false,
            nohide: true,
        }});
        const cstreetLabels = cstreets.map(street => { return {
            onclick: () => onclick(street),
            pt: projection(street.city.getLocation({hour:10, minute:0}, street.radius)),
            txt: street.name,
            ang: 0,
            off: [14,0],
            anchor: 'start',
            alignment: 'auto',
            fontSize: style.secondaryFontSize,
            fontWeight: 'normal',
            stroke: 'none',
            strokeWidth: 0,
            fill: style.outlineColor,
            selectable: false,
            nohide: true,
        }});
        const poiLabels = pois.map(poi => { return {
            onclick: () => onclick(poi),
            pt: projection(poi.coords),
            txt: poi.name,
            ang: 0,
            off: [0, style.primaryFontSize + 8],
            anchor: 'middle',
            alignment: 'hanging',
            fontSize: style.primaryFontSize,
            fontWeight: 'bold',
            stroke: style.backgroundColor,
            strokeWidth: 7,
            strokeOpacity: 0.3,
            fill: style.featureColor(poi, style),
            selectable: true,
        }});        
        const poiStatuses = style.showPoiStatus ? pois.map(poi => { return {
            onclick: () => onclick(poi),
            pt: projection(poi.coords),
            txt: poi.status(city),
            ang: 0,
            off: [0,12+10],
            anchor: 'middle',
            alignment: 'hanging',
            fontSize: style.secondaryFontSize,
            fontWeight: 'normal',
            stroke: style.backgroundColor,
            strokeWidth: 7,
            fill: style.featureColor(poi, style),
            selectable: true,
        }}) : [];        

        labels = [...cstreetLabels, ...tstreetLabels, ...poiStatuses, ...poiLabels];
    }

    let spaidx = rbush();
    const isVisible = function(label) {
        if (label.nohide) {
            return true;
        }
        const bb = bbox(label);
        const bbrb = {
            minX: bb.x,
            minY: bb.y,
            maxX: bb.x + bb.width,
            maxY: bb.y + bb.height,
        };
        const res = !spaidx.collides(bbrb);
        if (res) {
            spaidx.insert(bbrb);
        }
        return res;
    }

    const group = container.select('g.labels');    
    let nodes = group.selectAll("text").data(labels);

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
            .attr('alignment-baseline', (l) => l.alignment)
            .attr('fill', (l) => l.fill)
            .attr('pointer-events', (l) => l.selectable ? 'visible' : 'none')
            .attr('transform', (l) => 'translate(' + l.pt.join(',') + ') rotate(' + toDegrees(l.ang) + ') translate(' + l.off.join(',') + ')')    
            .attr('visibility', (l) => isVisible(l) ? 'inherit' : 'hidden')
            .style('user-select', (l) => l.selectable ? 'allowed' : 'none')
            .on('click', (l)=> l.onclick)
            .text((l) => l.txt);


    const showLabelBoxes = false; // this is for debugging only
    if (showLabelBoxes) {
        let bboxes = group.selectAll("rect").data(labels);
        bboxes.exit()
            .remove();
        bboxes.enter()
            .append('rect')
                .attr('fill', 'none')
                .attr('stroke', '#00ff00')
            .merge(bboxes)
                .attr('width', (l) => bbox(l).width)
                .attr('height', (l) => bbox(l).height)
                .attr('transform', (l) => 'translate(' + bbox(l).x + ',' + bbox(l).y + ')');        
    }
}