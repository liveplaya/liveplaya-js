import {select} from 'd3-selection';
import {geoMercator as mercator} from 'd3-geo';
import {range} from 'd3-array';
import {fromZoom, toZoom, slippyTileNumbers} from '../util';

function tileUrl(x, y, zoom, pattern) {
  return pattern
        .replace('{s}', ["a", "b", "c"][Math.random() * 3 | 0])
        .replace('{z}', Math.floor(zoom))
        .replace('{x}', Math.floor(x))
        .replace('{y}', Math.floor(y));
};

function lng2tile(lon,zoom) { 
  return (Math.floor((lon+180)/360*Math.pow(2,zoom))); 
}

function lat2tile(lat,zoom)  { 
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); 
}

function tile2lng(x,z) {
  return (x/Math.pow(2,z)*360-180); 
}

function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z); 
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

export 
function renderTiles(projection, container, unused, style) {
    const z = toZoom(projection.scale());
    const zoom = Math.round(z);
    const k = Math.pow(2, z - zoom);
    const width = container.node().ownerSVGElement.clientWidth;
    const height = container.node().ownerSVGElement.clientHeight;
    const northwest = projection.invert([0,0]);
    const southeast = projection.invert([width,height]);
    const top_tile    = lat2tile(northwest[1], zoom); 
    const left_tile   = lng2tile(northwest[0], zoom);
    const bottom_tile = lat2tile(southeast[1], zoom);
    const right_tile  = lng2tile(southeast[0], zoom);
    const tiles = [];
    for(let x=left_tile; x <=right_tile; ++x) {
      for(let y=top_tile; y <=bottom_tile; ++y) {
        const pt = projection([tile2lng(x, zoom), tile2lat(y, zoom)]);
        tiles.push([tileUrl(x, y, zoom, style.rasterTiles), Math.floor(pt[0]), Math.floor(pt[1]), z]);
      }
    }

    const group = container.select('g.tiles');
    const nodes = group.selectAll('image').data(tiles);
    
    nodes.exit()
        .remove();

    nodes.enter()
        .append('image')
        .merge(nodes)
            .attr("width", Math.ceil(256*k))
            .attr("height", Math.ceil(256*k))
            .attr("xlink:href", (t) => t[0])
            .attr("x", (t) => t[1])
            .attr("y", (t) => t[2])
            .attr("z", (t)=>t[3])
            .on('error', function() { select(this).style('visibility', 'hidden'); });

}
