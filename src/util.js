import {fromDegrees, EARTH_R} from './math';

export function fromZoom(zoom) {
    return Math.pow(2, 8 + zoom) / (2 * Math.PI);
};

export function toZoom(scale) {
    return Math.max(Math.log(2 * Math.PI * scale) / Math.LN2 - 8, 0)
};

export function toPixels(projection, distance) {
    // strictly speaking we should be looking at the latitude
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

export function dateStr(then) {
	return then.getMonth() + '/' + then.getDay() + '/' + then.getFullYear() + ' ' +
		(then.getHours() % 12) + ':' + then.getMinutes() + (then.getHours() < 12 ? 'am' : 'pm');
}

export function daysAgoStr(then) {
    if (then===null || then===undefined) {
        return then;
    } 

    var diff = Math.round((Date.now() - then.getTime())/1000);
    if (diff < 0) {
        return 'on ' + dateStr(then);
    }
    
    var second_diff = diff % 86400;
    var day_diff = Math.round(diff/86400);

    if (day_diff == 0) {
        if (second_diff < 10) return "now";
        //if (second_diff < 60) return second_diff + " seconds ago";
        if (second_diff < 120) return  "a minute ago";
        if (second_diff < 3600) return  Math.round(second_diff/60) + " minutes ago";
        if (second_diff < 7200) return "an hour ago";
        if (second_diff < 86400) return Math.round(second_diff/3600) + " hours ago";
    }
    if (day_diff == 1) return "yesterday";
    if (day_diff < 7) return day_diff + " days ago";
	return 'on ' + dateStr(then);    
    // if (day_diff < 14) return "last week";
    // if (day_diff < 31) return Math.round(day_diff/7) + " weeks ago";
    // if (day_diff < 60) return "last month";
    // if (day_diff < 365) return Math.round(day_diff/30) + " months ago";
    // if (day_diff < 730) return "a year ago";
    // return Math.round(day_diff/365) + " years ago";
}

export class Listeners {
    constructor() {
        const listeners = new Map();

        this.add = (event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        };

        this.remove = (event, callback) => {
            if (listeners.has(event)) {
                listeners.set(event, listeners.get(event).filter((cb) => cb != callback));
            }
        };

        this.notify = (event, ...args) => {
            if (listeners.has(event)) {
                for(let cb of listeners.get(event)) {
                    cb(...args);
                }
            }
        }
    }
}