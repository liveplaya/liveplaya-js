import {select, event} from 'd3-selection';
import {fromZoom, toZoom, debounce} from '../util';

export 
function enableZoom(map, container) {
    let x0,y0;

    const onDragProgress = () => {
        const tr = [event.clientX - x0, event.clientY - y0];
        const scale = 1;
        //console.log(`zoom tr: ${tr}, s:${scale}`);
        container.style('transform', `translate(${tr[0]}px,${tr[1]}px) scale(${scale})`);
    };

    const onDragStarted = () => {
        x0 = event.clientX;
        y0 = event.clientY;
        select(map.element).on('mousemove.zoom', onDragProgress);
    };

    const onDragEnded = () => {
        const tr = [event.clientX - x0, event.clientY - y0];
        const scale = 1;
        //console.log(`zoomend tr:${tr}, sc:${scale}`);
        let newCenterPoint = [map.element.clientWidth/2 - tr[0], 
            map.element.clientHeight/2 - tr[1]];
        let newCenterLngLat = map.unproject(newCenterPoint);
        let newScale = fromZoom(map.zoomLevel) * scale;
        map.setView(newCenterLngLat, toZoom(newScale));
        select(map.element).on('mousemove.zoom', null);
        container.style('transform', `translate(0px,0px) scale(1)`);
    };

    const onDblClick = () => {
        if (event.shiftKey) {
            map.zoomAround([event.clientX, event.clientY], 0.5);
        }
        else {
            map.zoomAround([event.clientX, event.clientY], 2);
        }
    };

    const onKeyDown = () => {
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

    select(map.element).on('mousedown.zoom', onDragStarted);
    select(map.element).on('mouseup.zoom', onDragEnded);
    select(map.element).on('dblclick.zoom', onDblClick);
    select('body').on('keydown.zoom', onKeyDown);
};

export
function disableZoom(map) {
    select(map.element).on('.zoom', null);
}
