import {select} from 'd3-selection';
import {geoMercator as mercator} from 'd3-geo';
import {MapData, StaticDataSource, AjaxDataSource, firstCity} from '../mapdata';
import {fromZoom, toZoom} from '../util';
import {clamp} from '../math';
import {enableZoom} from './zoomer'; 
import {renderTiles} from './tiles';
import {renderGrid} from './grid';
import {renderRoads} from './roads';
import {renderLabels} from './labels';
import {renderPois} from './pois';
import {renderOthers} from './others';
import {data as thisYearBaseMap} from '../basemap';

export default 
class MapWidget {
    constructor(element, {
        center, 
        data=thisYearBaseMap, 
        dataUrl = null,
        dataPollInterval = 30,
        zoom=14.38, 
        maxZoom=18,
        minZoom=14,
        showGrid=true, 
        showArt=true, 
        rasterTiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        outlineColor='#999',
        mutedColor='#ccc',
        backgroundColor='#fff',
        onclick=(f) => console.log(f.name + ' clicked'),
        onviewchanged=() => {},
    }={}) {
        
        const mapdata = new MapData(dataUrl ? [new StaticDataSource(data), new AjaxDataSource(dataUrl, dataPollInterval)] : 
            [new StaticDataSource(data)]);

        zoom = clamp(zoom, minZoom, maxZoom);

        const currentProjection = () => {
            const width = element.clientWidth;
            const height = element.clientHeight;
            return mercator()
                .center(center ? center : [0,0])
                .translate([width/2.0, height/2.0])
                .scale(fromZoom(zoom));
        };

        const render = () => {
            if (!center) {
                const city = firstCity(mapdata.features);
                center = city ? city.center : null;
            }
            renderMap(element, mapdata.features, currentProjection(), this, this.onclick);
        };

        this.onviewchanged = onviewchanged;
        this.onclick = onclick;

        this.project = (lnglat) => {
            return currentProjection()(lnglat);
        };

        this.unproject = (point) => {
            return currentProjection().invert(point);
        };

        this.setView = (newCenter, newZoom) => {
            center = newCenter;
            zoom = clamp(newZoom, minZoom, maxZoom);
            this.onviewchanged(this);
            render();
        };

        this.zoomAround = (focusPoint, k) => {
            center = this.unproject(focusPoint);
            // note: this doesn't really work with k's that result in non-integer 
            // zoom levels because of how fromZoom is implemented. Fix it?
            zoom = clamp(toZoom(k * fromZoom(zoom)), minZoom, maxZoom);
            center = this.unproject([element.clientWidth - focusPoint[0], 
                element.clientHeight - focusPoint[1]]);
            render();
        };

        Object.defineProperty(this, 'data', {
            get: () => mapdata,
            enumerable: true,
        });

        Object.defineProperty(this, 'element', {
            get: () => element,
            set: (v) => { element = element; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'center', {
            get: () => center,
            set: (v) => { this.setView(v, zoom); },
            enumerable: true,
        });

        Object.defineProperty(this, 'zoomLevel', {
            get: () => zoom,
            set: (v) => { this.setView(center, v); },
            enumerable: true,
        });

        Object.defineProperty(this, 'showGrid', {
            get: () => showGrid,
            set: (v) => { showGrid = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'showArt', {
            get: () => showArt,
            set: (v) => { showArt = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'rasterTiles', {
            get: () => rasterTiles,
            set: (v) => { rasterTiles = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'outlineColor', {
            get: () => outlineColor,
            set: (v) => { outlineColor = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'mutedColor', {
            get: () => outlineColor,
            set: (v) => { outlineColor = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'backgroundColor', {
            get: () => backgroundColor,
            set: (v) => { backgroundColor = v; render(); },
            enumerable: true,
        });

        window.addEventListener('resize', render);
        render();
        enableZoom(this, select(element).select('.container'));

        mapdata.query(render);
    }


}

function renderMap(element, features, projection, style, onclick) {
    let nodes = select(element).selectAll('svg').data([1]);

    nodes.exit()
        .remove();

    nodes.enter()
        .append('svg')
            .attr('shape-rendering', 'auto')
            .style('width', '100%')
            .style('height', '100%')
        .append('g')
            .classed('container', true)
        .merge(nodes)
            .style('background', style.backgroundColor)
        ;    

    const container = select(element).select('g.container');

    nodes = container.selectAll('g').data([
        'tiles', 
        'grid', 
        //'clicktargets',
        'outlines',
        'others',
        'fills',
        'pois',
        'labels',
        //'selection',
        //'ticks'
        ]);

    nodes.exit()
        .remove();

    nodes.enter()
        .append('g')
        .merge(nodes)
            .each(function(d) {
                select(this).classed(d, true); 
            });

    const layerRenderers = [
        renderGrid,
        renderRoads,
        renderLabels,
        renderPois,
        renderOthers, 
    ];

    for(let r of layerRenderers) {
        r(projection, container, features, style, onclick);
    }        
}