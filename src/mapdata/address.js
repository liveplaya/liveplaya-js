import {getDistance, normalizeAngle, toFeet} from '../math';

const minutesOnClockFace = 12*60;


export class Clock {
    constructor(hour, minute) {
        this.hour = hour % 12 == 0 ? 12 : hour % 12;
        this.minute = minute % 60;
    }

    toString() {
        return Clock.toString(this.hour, this.minute);
    }

    toSlug() {
        return Clock.toSlug(this.hour, this.minute);
    }

    get radians() {
        return Clock.toRadians(this.hour, this.minute);              
    }

    /** deprecated */
    toRadians() {
        return Clock.toRadians(this.hour, this.minute);      
    }

    static toRadians(hour, minute) {
        let mins = (hour*60 + minute) % minutesOnClockFace;
        if (mins > minutesOnClockFace/2) {
            mins = -(minutesOnClockFace - mins);
        }
        return 2*Math.PI*mins/minutesOnClockFace;                    
    }

    static toString(hour, minute) {
        let s = hour + ':';
        if (minute < 10) {
            s += '0';
        }
        return s + minute;
    }

    static toSlug(hour, minute) {
        let s = hour + '-';
        if (minute < 10) {
            s += '0';
        }
        return s + minute;
    }
}

export function toClock(angle) {
    angle = normalizeAngle(angle, Math.PI);
    let mins = Math.floor(angle * minutesOnClockFace / (2*Math.PI) + 0.5);
    let hr = Math.floor(mins/60);
    if (hr == 0) {
        hr = 12;
    }
    return new Clock(hr, mins);
}

export class Address {
    constructor(clock, distance, street, landmark) {
        this.clock = clock;
        this.distance = distance;
        this.street = street;
        this.landmak = landmark;
    }

    toString() {
        if (self.distance > 10000) {
            return 'default world';
        }
        const res = this.clock.toString();
        if (!this.street) {
            return res + ' / ' + toFeet(this.distance).toFixed(0) + ' ft';
        }
        return res + ' & ' + this.street.letter;
    }

    toLongString() {
        const landmarkName = self.distance > 10000 ? 'Default World' : self.landmark ? self.landmark.name : null;
        let res = this.clock.toString();
        if (this.street) {
            res += ' & ' + this.street.name;
        }
        if (landmarkName) {
            res += '(' + landmarkName + ')';
        }
        res += ', ' + toFeet(this.distance).toFixed(0) + ' feet';
        return res;
    }
}

export function ctr(hour, minute) {
    return Clock.toRadians(hour, minute);
}
