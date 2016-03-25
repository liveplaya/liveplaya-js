import d3 from 'd3';

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
          cols = d3.range(Math.max(0, Math.floor(-origin[0])), Math.max(0, Math.ceil(size[0] / k - origin[0]))),
          rows = d3.range(Math.max(0, Math.floor(-origin[1])), Math.max(0, Math.ceil(size[1] / k - origin[1])));

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

var tileUrl = function(tile, pattern) {
    return pattern
        .replace('{s}', ["a", "b", "c"][Math.random() * 3 | 0])
        .replace('{z}', Math.floor(tile[2]))
        .replace('{x}', Math.floor(tile[0]))
        .replace('{y}', Math.floor(tile[1]));
};

export function renderTiles(svg, projection, urlPattern) {
    const width = svg.clientWidth,
        height = svg.clientHeight,
        tile = geotile().size([width, height]);
      
    const tileProjection = d3.geo.mercator()
            .translate([0,0])
            .scale(projection.scale());
    
    const tr1 = projection.translate();
    const tr2 = tileProjection(projection.center());
    const tr = [ tr1[0] - tr2[0], tr1[1] - tr2[1] ];
    tileProjection.translate(tr);
            
    const tiles = tile
      .scale(tileProjection.scale()*2*Math.PI)
      .translate(tileProjection.translate())
      ();

    const image = d3.select(svg)
        .attr('transform', `scale(${tiles.scale})translate(${tiles.translate})`)
        .selectAll("image")
        .data(tiles, function(d) { return d; });

    image.exit()
         .remove();

      image.enter().append("image")
          .attr("xlink:href", function(d) { return tileUrl(d, urlPattern); })
          .attr("width", 1)
          .attr("height", 1)
          .attr("x", function(d) { return d[0]; })
          .attr("y", function(d) { return d[1]; })
          .on('error', function() { d3.select(this).style('visibility', 'hidden'); });
}