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

export class Address {
    constructor(clock, distance) {
        this.clock = clock;
        this.distance = distance;
    }
}

export function ctr(hour, minute) {
    return Clock.toRadians(hour, minute);
}
