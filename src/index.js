import {StaticGeoJSON, AjaxGeoJSON, DefaultData} from './mapdata';
import MapWidget from './mapwidget';

if (window) {
    window.brcmap = {Map: MapWidget};
}