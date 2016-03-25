import d3 from 'd3';
import {renderTiles} from './tiles';

export class MapWidget {
    constructor(node) {
	    node.innerHTML = 
	        '<svg width="100%" height="100%" style="background:#fff" shape-rendering="auto">' + 
	        '<g>' +
	        '<g class="tiles"></g>' + 
	        '<g class="grid"></g>' + 
	        '<g class="clicktargets"></g>' + 
	        '<g class="road-outlines"></g>' + 
	        '<g class="plaza-outlines"></g>' + 
	        '<g class="road-fills"></g>' + 
	        '<g class="plaza-fills"></g>' + 
	        '<g class="borders"></g>' + 
	        '<g class="location"><circle></circle></g>' +
	        '<g class="markers"></g>' + 
	        '<g class="labels"></g>' + 
	        '<g class="selection"></g>' +
	        '<g class="ticks"></g>' +
	        '</g>' + 
	        '</svg>' 
	   //     '<button class="locator-button"></button>' +
	   //     '<button class="zoom-in-button"></button>' +
	   //     '<button class="zoom-out-button"></button>' +
	   //     '<div class="credits"><a href="#">Map credits</a></div>'
	        ;

	    const svg = d3.select(node).select('svg').node();
	    const width = node.clientWidth;
        const height = node.clientHeight;
    	const projection = d3.geo.mercator()
        	.center([-119.203150, 40.788800])
        	.translate([width/2, height/2])
        	.scale(fromZoom(14)*1.3) //15
        	;

        renderTiles(svg, projection, 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
}

function fromZoom(zoom) {
    return (1 << 8 + zoom) / (2 * Math.PI);
};

function toZoom(scale) {
    return Math.max(Math.log(2 * Math.PI * scale) / Math.LN2 - 8, 0)
};

function toPixels(projection, distance) {
    // stricctly speaking we should be looking at the latitude
    // at the exact point, not at projection center - but at our
    // scales the difference is negligible
    var lat = projection.center()[1],
        scale = projection.scale();
    return Math.round(distance * scale / (EARTH_R * Math.cos(fromDegrees(lat))));
};

