import {fromDegrees, EARTH_R} from './math';

export function fromZoom(zoom) {
    return Math.pow(2, 8 + zoom) / (2 * Math.PI);
};

export function toZoom(scale) {
    return Math.max(Math.log(2 * Math.PI * scale) / Math.LN2 - 8, 0)
};

export function toPixels(projection, distance) {
    // stricctly speaking we should be looking at the latitude
    // at the exact point, not at projection center - but at our
    // scales the difference is negligible
    var lat = projection.center()[1],
        scale = projection.scale();
    return distance * scale / (EARTH_R * Math.cos(fromDegrees(lat)));
};

export function slugify(str) {
	return str.toString().toLowerCase()
	    .replace(/\s+/g, '-')           // Replace spaces with -
	    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
	    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
	    .replace(/^-+/, '')             // Trim - from start of text
	    .replace(/-+$/, '');            // Trim - from end of text
}

export function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

