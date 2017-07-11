export const EARTH_R =  6378137;
const TWO_PI = Math.PI*2;

export function sign(v) {
    return v > 0 ? 1 : v < 0 ? -1 : 0;
};

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function normalizeAngle(angle, center) {
    center = center === undefined ? 0 : center;
    return angle - TWO_PI*Math.floor((angle + Math.PI - center)/TWO_PI);
};

export function fromDegrees(deg) {
    return deg * Math.PI / 180;
};

export function toDegrees(rad) {
    return (rad * 180 / Math.PI) % 360;
};

export function fromFeet(ft) {
    return ft/toFeet(1);
};

export function toFeet(m) {
    return m*3.28084;
};

/**
 * Get great-circle distance between locations. The distance is 
 * calculated using spherical law of cosines, an approximation to 
 * haversine formula.
 *
 * @param from first location, [longitude, latitude] array
 * @param to second location, [longitude, latitude] array
 * @return distance in meters.
 */
export function getDistance(from, to) {
    // φ: latitude, λ: longitude 
    var λ1 = fromDegrees(from[0]),
        φ1 = fromDegrees(from[1]),
        λ2 = fromDegrees(to[0]), 
        φ2 = fromDegrees(to[1]),
        Δλ = λ2 - λ1;
    
    return Math.acos( Math.sin(φ1)*Math.sin(φ2) + 
        Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * EARTH_R;
};

/**
 * Get initial bearing (aka forward azimuth) between locations.
 * This is an angle between cardinal direction North and 
 * direction to second location as seen from first location.
 * 
 * @param from first location, [longitude, latitude] array
 * @param to second location, [longitude, latitude] array
 * @return bearing in radians, clockwise, -PI to PI
 */
export function getBearing(from, to) {
    // φ: latitude, λ: longitude 
    var λ1 = fromDegrees(from[0]),
        φ1 = fromDegrees(from[1]),
        λ2 = fromDegrees(to[0]), 
        φ2 = fromDegrees(to[1]),
        y = Math.sin(λ2-λ1) * Math.cos(φ2),
        x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);

    return Math.atan2(y, x);
};

/**
 * Calculate destination point given initial location, bearing, 
 * and distance.
 */ 
export function getLocation(from, bearing, distance) {
    // φ: latitude, λ: longitude 
    var λ1 = fromDegrees(from[0]),
        φ1 = fromDegrees(from[1]),
        φ2 = Math.asin(Math.sin(φ1)*Math.cos(distance/EARTH_R) +
                Math.cos(φ1)*Math.sin(distance/EARTH_R)*Math.cos(bearing)),
        λ2 = λ1 + Math.atan2(Math.sin(bearing)*Math.sin(distance/EARTH_R)*Math.cos(φ1),
            Math.cos(distance/EARTH_R)-Math.sin(φ1)*Math.sin(φ2));
    
    return [toDegrees(λ2), toDegrees(φ2)];
};

/**
 * Generate locations along the circle arc
 */
export function interpolateArc(center, radius, fromAngle, toAngle, npoints) {
    if (fromAngle != 0 || toAngle != 2*Math.PI) {
        [fromAngle, toAngle] = [fromAngle, toAngle].map((a) => normalizeAngle(a, Math.PI));
    }
    let points = [];
    for(let i=npoints; i>=0; --i) {
        points.push(getLocation(center, fromAngle + i*(toAngle - fromAngle)/npoints, radius));
    }
    return points;
}




function vadd(a,b,k) {
    k = k === undefined ? 1 : k;
    return [a[0]+k*b[0],a[1]+k*b[1]];
};

function join(array1, array2, callback) {
    var res = []
    for(var i=0; i<array1.length; i++) {
        for(var j=0; j<array2.length; j++) {
            res.push(callback(array1[i], array2[j]));
        }
    }
    return res;
};

function cross(array1, array2, callback) {
    var res = []
    for(var i=0; i<array1.length && i<array2.length; i++) {
        res.push(callback(array1[i], array2[j]));
    }
    return res;
};

function lineIntersection(start1, end1, start2, end2) {
    var line1StartX = start1[0], 
        line1StartY = start1[1], 
        line1EndX = end1[0], 
        line1EndY = end1[1], 
        line2StartX = start2[0], 
        line2StartY = start2[1], 
        line2EndX = end2[0], 
        line2EndY = end2[1];

    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return null;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
/*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    //return result;
    //return result.onLine1 && result.onLine2 ? [result.x, result.y] : null;
    return result.onLine1 ? [result.x, result.y] : null;
    //return [result.x, result.y];
};
