import {select} from 'd3-selection';
import {geoMercator as mercator} from 'd3-geo';
import {MapData} from '../mapdata';
import {fromZoom, toZoom} from '../util';
import {clamp} from '../math';
import {enableZoom} from './zoomer'; 
import {renderTiles} from './tiles';
import {renderGrid} from './grid';
import {renderRoads} from './roads';
import {renderLabels} from './labels';
import {renderPois} from './pois';
import {renderPlayaBg} from './playabg';
import {renderOthers} from './others';
import {data as thisYearBaseMap} from '../basemap';

function getFeatureColor(f, style, isSelected) {
    if (f.kind == 'vehicle') {
        return style.highlightColor;
    }
    return style.outlineColor;
}

export default 
class MapWidget {
    constructor(element, {
        center, 
        baseData=thisYearBaseMap, 
        zoom=14.38, 
        maxZoom=18,
        minZoom=14,
        showGrid=false, 
        showPoiStatus=true, 
        showRasterTilesOnPlaya=false,
        rasterTiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        rasterTilesOpacity=1, 
        outlineColor='#999',
        mutedColor='#ccc',
        highlightColor='#ff0000',
        backgroundColor='#fff',
        onclick=(f) => console.log(f.name + ' clicked'),
        onviewchanged=() => {},
        featureColor=getFeatureColor,
    }={}) {
        
        const mapdata = new MapData(baseData);

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
                center = mapdata.city ? mapdata.city.center : null;
            }
            renderMap(element, mapdata, currentProjection(), this, this.onclick);
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

        this.clearData = () => {
            mapdata.clear();
            return this;
        };

        this.addGeojsonData = (...args) => {
            mapdata.addGeojson(...args);
            return this;
        };

        this.addGeojsonDataUrl = (...args) => {
            mapdata.addGeojsonUrl(...args);
            return this;
        };

        this.onData = (...args) => {
            mapdata.on(...args);
            return this;
        };

        this.offData = (...args) => {
            mapdata.off(...args);
            return this;
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

        Object.defineProperty(this, 'showRasterTilesOnPlaya', {
            get: () => showRasterTilesOnPlaya,
            set: (v) => { showRasterTilesOnPlaya = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'showPoiStatus', {
            get: () => showPoiStatus,
            set: (v) => { showPoiStatus = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'rasterTiles', {
            get: () => rasterTiles,
            set: (v) => { rasterTiles = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'rasterTilesOpacity', {
            get: () => rasterTilesOpacity,
            set: (v) => { rasterTilesOpacity = v; render(); },
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

        Object.defineProperty(this, 'highlightColor', {
            get: () => highlightColor,
            set: (v) => { highlightColor = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'backgroundColor', {
            get: () => backgroundColor,
            set: (v) => { backgroundColor = v; render(); },
            enumerable: true,
        });

        Object.defineProperty(this, 'featureColor', {
            get: () => featureColor,
            set: (v) => { featureColor = v; render(); },
            enumerable: true,
        });

        window.addEventListener('resize', render);
        render();
        enableZoom(this, select(element).select('.container'));

        // Rerender every once in a while to update relative times
        // like "N minutes ago"
        let refreshTimerId = null;
        const refreshRelativeTimes = () => {
            render();
            refreshTimerId = setTimeout(refreshRelativeTimes, 30000);
        };
        refreshTimerId = setTimeout(refreshRelativeTimes, 30000);


        mapdata.on('update', render);
    }


}

function renderMap(element, data, projection, style, onclick) {
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
        'playabg', 
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

    const features = data.features;
    const city = data.city;

    renderTiles(projection, container, style);
    renderPlayaBg(projection, container, style);
    renderGrid(projection, container, city, style);

    const layerRenderers = [
        renderRoads,
        renderLabels,
        renderPois,
        renderOthers, 
    ];

    for(let r of layerRenderers) {
        r(projection, container, features, city, style, onclick);
    }        
}