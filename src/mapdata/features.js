import {range} from 'd3-array';
import {getLocation, interpolateArc} from '../math';
import {Clock, Address, ctr} from './address';
import {slugify} from '../util';

export class Feature {
    constructor() {
        this.addedTo = null;
    }

    toString() {
        return this.name;
    }
}

export class City extends Feature {
    constructor(year, center, orientation) {
        super();
        this.year = year;
        this.center = center;
        this.orientation = orientation;
    }

    get id() {
        return 'brc' + this.year;
    }

    get city() {
        return this;
    }

    get name() {
        return "Black Rock City " + this.year;
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

}

class CityFeature extends Feature {
    constructor(city) {
        super();
        this.city = city;
    }

    get id() {
        return this.city.id + '/' + this.slug;
    }

    get slug() {
        return slugify(this.name);
    }
}

export class CStreet extends CityFeature {
    constructor(city, name, radius, width) {
        super(city);
        this.name = name;
        this.radius = radius;
        this.width = width;
    }

    get slug() {
        return this.name=='Esplanade' ? 'esplanade' : this.name[0].toLowerCase() + '-street';        
    }

    get letter() {
        return this.name[0].toUpperCase();
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
        super(city);
        this.direction = direction;
        this.width = width;
    }

    get slug() {
        return this.direction.toSlug() + '-street';
    }

    get name() {
        return this.direction.toString();
    }

    get spans() {
        return [[this.direction.minute == 15 || this.direction.minute == 45 ? this.city.cstreets['G'].radius : 
            this.city.esplanade.radius, this.city.cstreets['L'].radius]];
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
        super(city);
        this.direction = direction;
        this.width = width;
    }

    get name() {
        return this.direction.hour + " O'Clock Promenande";
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
        super(city);
        this.name = name;
        this.center = city.getLocation({hour: hour, minute: minute}, distance);
        this.radius = radius;
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
        super(city);
        this.center = city.getLocation({hour: 6, minute: 0}, centerCampDistance);
        this.radius = radius;
        this.width = width;
    }

    get name() {
        return "Rod's Road";
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
        super(city);
        this.radius = radius;
    }

    get name() {
        return "Trash Fence";
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
        super(city);
        this.name = name;
        this.center = coords;
    }

    get geometry() {
        return {
            type: 'Point',
            coordinates: this.center
        }
    }

    get isPOI() { 
        return true;
    }
}

let nextMarkerId = 1;

export class Marker extends Feature {
    constructor(coords, name, color=null, id=null) {
        super();
        this.id = id ? id : 'marker' + nextMarkerId++;
        this.name = name;
        this.coords = coords;
        this.color = color ? color : '#fe7569';
    }

    get center() {
        return this.coords;
    }

    get geometry() {
        return {
            type: 'Point',
            coordinates: this.coords
        }
    }

    get isPOI() { 
        return true;
    }
}
