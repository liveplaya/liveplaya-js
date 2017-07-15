import {range} from 'd3-array';
import {getLocation, getDistance, getBearing, interpolateArc} from '../math';
import {Clock, Address, toClock, ctr} from './address';
import {slugify, daysAgoStr} from '../util';

export class Feature {
    constructor(id) {
        this.id = id;
    }

    toString() {
        return this.name;
    }

    get kind() {
        return 'other';
    }

    get coords() {
        return this.geometry && this.geometry.type == 'Point' ? this.geometry.coordinates : null;
    }

    status(city, {verbose=false}={}) {
        const parts = [];
        if (this.lastseen) {
            parts.push(daysAgoStr(this.lastseen));
        }
        if (this.coords) {
            const addr = city.getAddress(this.coords);
            parts.push('at ' + (verbose ? addr.toLongString() : addr.toString())); 
        } 
        else {
            parts.push('at unknown location');
        }
        return parts.join(' ');
    }
}

export class City extends Feature {
    constructor(year, center, orientation) {
        super('brc' + year);
        this.year = year;
        this.center = center;
        this.orientation = orientation;
        this.features = [];
    }

    get city() {
        return this;
    }

    get kind() {
        return 'city';
    }

    get name() {
        return "Black Rock City " + this.year;
    }

    get coords() {
        return this.center;
    }

    get cstreets() {
        return this.features.filter((f) => f instanceof CStreet);
    }

    getBearing(angle) {
        return Math.PI - this.orientation + angle
    }

    getLocation({hour, minute, angle}={}, dist) {
        if (angle === undefined || angle === null) {
            angle = Clock.toRadians(hour, minute);
        }
        return getLocation(this.center, this.getBearing(angle), dist);
    }

    getClock(coords) {
        return toClock(getBearing(this.center, coords) - this.orientation + Math.PI/2);
    }

    getAddress(coords) {
        const dist = getDistance(this.center, coords);
        const clock = this.getClock(coords);
        let street = null;
        if (clock.hour > 1 && clock.hour < 11) {
            if (dist > this.esplanade.radius - ((this.aStreet.radius - this.esplanade.radius)/2)) {
                if (dist < (this.esplanade.radius + this.aStreet.radius)/2) {
                    street = this.esplanade;
                }
                else {
                    for(let i=1; i<this.cstreets.length; i++) {
                        if (dist < (this.cstreets[i].radius + this.cstreets[i-1].radius)/2) {
                            street = this.cstreets[i-1];
                            break;
                        }
                    }
                    if (!street && dist < this.lStreet.radius + ((this.lStreet.radius - this.kStreet.radius)/2)) {
                        street = this.lStreet;
                    }
                }
            } 
        }
        return new Address(clock, getDistance(this.center, coords), street);
    }

};


class CityFeature extends Feature {
    constructor(city, slug) {
        super(city.id + '/' + slug);
        this.city = city;
        city.features.push(this);
    }
}

export class CStreet extends CityFeature {
    constructor(city, name, radius, width) {
        super(city, name=='Esplanade' ? name.toLowerCase() : name[0].toLowerCase() + '-street');
        this.name = name;
        this.radius = radius;
        this.width = width;
        if (name != 'Esplanade') {
            city[name[0].toLowerCase() + 'Street'] = this;
        }
    }

    get kind() {
        return 'street';
    }

    get streetKind() {
        return 'cstreet';
    }

    get letter() {
        return this.name == 'Esplanade' ? 'Esp' : this.name[0].toUpperCase();
    }

    get geometry() {
        const spans = this.letter != 'F' ? [[ctr(2,0), ctr(10,0)]]  : 
            [[ctr(2,30), ctr(3,30)], [ctr(4,0), ctr(5,0)], [ctr(7,0), ctr(8,0)], [ctr(8,30), ctr(9,30)]];
        return {
            type: 'MultiLineString',
            coordinates: spans.map((s) => interpolateArc(this.center, this.radius, 
                this.city.getBearing(s[0]), this.city.getBearing(s[1]), 25))
        }
    }
    
    get isRoad() { 
        return true;
    }

    get center() {
        return this.city.center;
    }
}

export class TStreet extends CityFeature {
    constructor(city, direction, width) {
        super(city, direction.toSlug() + '-street');
        this.direction = direction;
        this.width = width;
    }

    get name() {
        return this.direction.toString();
    }

    get kind() {
        return 'street';
    }

    get streetKind() {
        return 'tstreet';
    }

    get spans() {
        return [[this.direction.minute == 15 || this.direction.minute == 45 ? this.city.gStreet.radius : 
            this.city.esplanade.radius, this.city.lStreet.radius]];
    }

    get geometry() {
        return {
            type: 'MultiLineString',
            coordinates: this.spans.map((s) => s.map((d) => this.city.getLocation(this.direction, d))),
        }
    }
    
    get isRoad() { 
        return true;
    }
}

export class Promenande extends CityFeature {
    constructor(city, direction, width) {
        const name = direction.hour + " O'Clock Promenande";
        super(city, slugify(name));
        this.name = name;
        this.direction = direction;
        this.width = width;
    }

    get kind() {
        return 'street';
    }

    get streetKind() {
        return 'promenande';
    }

    get span() {
        return [0, this.city.esplanade.radius];
    }

    get geometry() {
        return {
            type: 'LineString',
            coordinates: this.span.map((d) => this.city.getLocation(this.direction, d)),
        }
    }
    
    get isRoad() { 
        return true;
    }
}

export class Plaza extends CityFeature {
    constructor(city, name, hour, minute, distance, radius) {
        super(city, slugify(name));
        this.name = name;
        this.center = city.getLocation({hour: hour, minute: minute}, distance);
        this.radius = radius;
    }

    get kind() {
        return 'plaza';
    }

    get geometry() {
        return {
            type: 'Polygon',
            coordinates: [interpolateArc(this.center, this.radius, 0, 2*Math.PI, 25)]
        }
    }
    
    get isRoad() { 
        return true;
    }
}

export class RodsRoad extends CityFeature {
    constructor(city, centerCampDistance, radius, width) {
        const name = "Rod's Road";
        super(city, slugify(name));
        this.name = name;
        this.center = city.getLocation({hour: 6, minute: 0}, centerCampDistance);
        this.radius = radius;
        this.width = width;
    }

    get kind() {
        return 'street';
    }

    get geometry() {
        return {
            type: 'LineString',
            coordinates: interpolateArc(this.center, this.radius, 0, 2*Math.PI, 25)
        }
    }
    
    get isRoad() { 
        return true;
    }
}

export class Fence extends CityFeature {
    constructor(city, radius) {
        const name =  "Trash Fence";
        super(city, slugify(name));
        this.name = name;
        this.radius = radius;
    }

    get geometry() {
        return {
            type: 'LineString',
            coordinates: [0,1,2,3,4,0].map((i) => getLocation(this.city.center, this.city.getBearing(2*i*Math.PI/5), this.radius)),
        }
    }
}

export class Art extends CityFeature {
    constructor(city, name, coords) {
        super(city, slugify(name));
        this.name = name;
        this.center = coords;
    }

    get kind() {
        return 'art';
    }

    get geometry() {
        return {
            type: 'Point',
            coordinates: this.center
        }
    }
}

export class Vehicle extends Feature {
    constructor(id, name, kind, {trackerId=null}={}) {
        super(id);
        this.name = name;
        this.vehicleKind = kind;
        this.trackerId = trackerId;
    }

    get kind() {
        return 'vehicle';
    }

    get geometry() {
        if (this.tracker) {
            return this.tracker.geometry;
        } 
        return null;
    }

    get lastseen() {
        if (this.tracker) {
            return this.tracker.lastseen;
        } 
        return null;
    }
};

export class APRSStation extends Feature {
    constructor(callsign, {lastseen=null, coords=null, rawPacket=null, comment=null, symbol=null, path=null} = {}) {
        super('aprs/' + callsign.toLowerCase())
        this.name = callsign;
        this.lastseen = lastseen;
        this.rawPacket = rawPacket;
        this.comment = comment;
        this.geometry = coords ? {
            type: 'Point',
            coordinates: coords
        } : null;
    }

    get kind() {
        return 'aprs';
    }

    get isAPRSStation() {
        return true;
    }
};


let nextMarkerId = 1;

export class Marker extends Feature {
    constructor(coords, {name=null, color=null, id=null, lastseen=null} = {}) {
        super();
        this.id = id ? id : 'marker' + nextMarkerId++;
        this.name = name;
        this.color = color ? color : '#fe7569';
        this.lastseen = lastseen;
        this.geometry = {
            type: 'Point',
            coordinates: coords
        }
    }

    get center() {
        return this.coords;
    }
}
