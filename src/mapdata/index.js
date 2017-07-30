import {City} from './features';
import {StaticDataSource, AjaxDataSource} from './sources';
import {Listeners} from '../util';

export
class MapData {
    constructor(baseData) {
        const listeners = new Listeners();
        let sources = [new StaticDataSource(baseData)];
        let features = [];
        let city = null;
 
        const update = () => {
            const featuresById = new Map();
            city = null;

            for(let src of sources) {
                for(let f of src.features) {
                    featuresById.set(f.id, f);
                    if (f instanceof City) {
                        city = f;
                    }
                }
            }

            for(let f of featuresById.values()) {
                if (f.trackerId && featuresById.has(f.trackerId)) {
                    f.tracker = featuresById.get(f.trackerId);
                    f.tracker.tracked = true;
                }
            }

            features = [...featuresById.values()];
            listeners.notify('update', this);
        };

        const stop = () => {
            for(let ds of sources) {
                ds.stop();
            }
        };

        this.clear = () => {
            sources = [];
            update();
            return this;
        };

        this.addGeojson = (data) => {
            sources.push(new StaticDataSource(data, update));
            update();
            return this;
        };

        this.addGeojsonUrl = (url, pollInterval) => {
            sources.push(new AjaxDataSource(url, pollInterval, update));
            update();
            return this;
        };

        this.on = (event, callback) => {
            listeners.add(event, callback);
            return this;
        };

        this.off = (event, callback) => {
            listeners.remove(event, callback);
            return this;
        };

        Object.defineProperty(this, 'city', {
            get: () => city,
            enumerable: true,
        });

        Object.defineProperty(this, 'features', {
            get: () => features,
            enumerable: true,
        });

        update();
    }
}

export * from './features';
export * from './sources';