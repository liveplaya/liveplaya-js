import {City} from './features';

export
class MapData {
    constructor(datasources, {maxCachedFeatures = 1000} = {}) {
        const featuresById = new Map();
        let notify = () => {};

        const add = (feature) => {
            const old = featuresById.get(feature.id);
            if (old !== feature) {
                if (old) {
                    old.addedTo = null;
                }
                featuresById.set(feature.id, feature);
                feature.addedTo = this;
            }
        };

        const stop = () => {
            for(let ds of datasources) {
                ds.stop();
            }
        };

        const update = (dsFeatures) => {
            for(let f of dsFeatures) {
                add(f);
            }
            notify(this.features);
            if (this.onupdate) {
                this.onupdate(this.features);
            }
        };

        this.query = (callback) => {
            stop();
            notify = callback;
            if (featuresById.size > maxCachedFeatures) {
                featuresById.clear();
            }
            for(let ds of datasources) {
                ds.query(update);
            }
        }

        this._featureById = (id) => {
            return featuresById.get(id);
        }

        Object.defineProperty(this, 'features', {
            get: () => [...featuresById.values()],
            enumerable: true,
        });
    }
}

export
function firstCity(features) {
    for(let f of features) {
        if (f instanceof City) {
            return f;
        }
    }
}

export * from './features';
export * from './sources';


