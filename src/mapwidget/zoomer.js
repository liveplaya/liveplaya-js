import {select, event} from 'd3-selection';
import {zoom, zoomTransform, zoomIdentity} from 'd3-zoom';
import {fromZoom, toZoom, debounce} from '../util';

export 
function enableZoom(map, container) {
    let x0,y0,zoomer,onStart,onEnd,onZoom,onKeyDown;

    onStart = (e) => {
        x0 = event.clientX;
        y0 = event.clientY;
    };

    onEnd = (e) => {        
        const tr = [event.transform.x, event.transform.y];
        const k = event.transform.k;

        let newCenterPoint = [(map.element.clientWidth/2 - tr[0])/k, 
            (map.element.clientHeight/2 - tr[1])/k];
        let newCenterLngLat = map.unproject(newCenterPoint);
        let newZoom = toZoom(fromZoom(map.zoomLevel) * event.transform.k);

        map.setView(newCenterLngLat, newZoom);
    
        container.attr('transform', null);
        event.target.on('.zoom', null);
        select(map.element).call(zoomer.transform, zoomIdentity);
        event.target.on('end.zoom', onEnd).on('zoom', onZoom);
    };

    onZoom = (e) => {
        container.attr('transform', event.transform);
    };

    onKeyDown = () => {
        const zoomStep = 0.1;
        if (event.keyCode == 187 /* equals, same key as plus */) {
            map.setView(map.center, map.zoomLevel + zoomStep);
            event.stopPropagation();
        }
        else if (event.keyCode == 189 /* minus */) {
            map.setView(map.center, map.zoomLevel - zoomStep);
            event.stopPropagation();
        }
    };

    zoomer = zoom().on("end.zoom", onEnd).on("zoom.zoom", onZoom);
    
    select(map.element).call(zoomer);
    select(map.element).on('keydown.zoom', onKeyDown);
}

export
function disableZoom(map) {
    select(map.element).on('.zoom', null);
}
