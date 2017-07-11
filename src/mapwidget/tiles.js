import {select} from 'd3-selection';
import {geoMercator as mercator} from 'd3-geo';
import {range} from 'd3-array';
import {fromZoom, toZoom} from '../util';

// From https://github.com/d3/d3-plugins/tree/master/geo/tile
function geotile() {
    var size = [960, 500],
        scale = 256,
        translate = [size[0] / 2, size[1] / 2],
        zoomDelta = 0;

    function tile() {
      var z = Math.max(Math.log(scale) / Math.LN2 - 8, 0),
          z0 = Math.round(z + zoomDelta),
          k = Math.pow(2, z - z0 + 8),
          origin = [(translate[0] - scale / 2) / k, (translate[1] - scale / 2) / k],
          tiles = [],
          cols = range(Math.max(0, Math.floor(-origin[0])), Math.max(0, Math.ceil(size[0] / k - origin[0]))),
          rows = range(Math.max(0, Math.floor(-origin[1])), Math.max(0, Math.ceil(size[1] / k - origin[1])));

      rows.forEach(function(y) {
        cols.forEach(function(x) {
          tiles.push([x, y, z0]);
        });
      });

      tiles.translate = origin;
      tiles.scale = k;

      return tiles;
    }

    tile.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return tile;
    };

    tile.scale = function(_) {
      if (!arguments.length) return scale;
      scale = _;
      return tile;
    };

    tile.translate = function(_) {
      if (!arguments.length) return translate;
      translate = _;
      return tile;
    };

    tile.zoomDelta = function(_) {
      if (!arguments.length) return zoomDelta;
      zoomDelta = +_;
      return tile;
    };

    return tile;
}

function tileUrl2(tile, pattern) {
    return pattern
        .replace('{s}', ["a", "b", "c"][Math.random() * 3 | 0])
        .replace('{z}', Math.floor(tile[2]))
        .replace('{x}', Math.floor(tile[0]))
        .replace('{y}', Math.floor(tile[1]));
};

function tileUrl(lnglat, pattern) {
  const [lon, lat, zoom] = lnglat;
  const x = (lon+180)/360*Math.pow(2,zoom);
  const y = (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom);
  return pattern
        .replace('{s}', ["a", "b", "c"][Math.random() * 3 | 0])
        .replace('{z}', Math.floor(zoom))
        .replace('{x}', Math.floor(x))
        .replace('{y}', Math.floor(y));
};

export default 
function renderTiles0(group, projection, urlPattern) {
    const zoom = toZoom(projection.scale());
    const tiles = [projection.center()];

    const image = group
      .selectAll("image")
      .data(tiles, function(d) { return d; });

    image.exit()
      .remove();

    image.enter().append("image")
      .attr("xlink:href", function(tile) { return tileUrl(tile, zoom, urlPattern); })
      .attr("width", 256)
      .attr("height", 256)
      .attr("x", group.clientWidth/2)
      .attr("y", group.clientHeight/2)
      .on('error', function() { select(this).style('visibility', 'hidden'); });

}


export function renderTiles(projection, element, city, style) {
    const group = element.select('g.tiles');
    const width = group.node().clientWidth,
        height = group.node().clientHeight,
        tile = geotile().size([width, height]);

    const tileProjection = mercator()
            .translate([0,0])
            .scale(projection.scale());
    
    const tr1 = projection.translate();
    const tr2 = tileProjection(projection.center());
    const tr = [ tr1[0] - tr2[0], tr1[1] - tr2[1] ];
    tileProjection.translate(tr);
            
    const tiles = style.rasterTiles ? tile
      .scale(tileProjection.scale()*2*Math.PI)
      .translate(tileProjection.translate())
      () : [];

    const images = group.attr('transform', `scale(${tiles.scale})translate(${tiles.translate})`)
      .selectAll("image")
      .data(tiles, function(d) { return d; });

    images.exit()
      .remove();

    images.enter()
        .append("image")
        .merge(images)
            .attr("xlink:href", function(d) { return tileUrl(d, style.rasterTiles); })
            .attr("width", 1)
            .attr("height", 1)
            .attr("x", function(d) { return d[0]; })
            .attr("y", function(d) { return d[1]; })
            .on('error', function() { select(this).style('visibility', 'hidden'); });

    // let nodes = group.selectAll("circle").data(radials);

    // nodes.exit()
    //     .remove();

    // nodes.enter()
    //     .append('circle')
    //     .merge(nodes)
    //     .attr('r', (radius) => {return toPixels(projection, radius)})
    //     .attr('cx', center[0])
    //     .attr('cy', center[1]);
}