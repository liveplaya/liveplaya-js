import {parseGeojson} from '../formats';

export
class StaticDataSource {
    constructor(data) {
    	const features = parseGeojson(data);
    	let timeoutId = null;

        this.query = (callback) => {
        	this.stop();
        	// make sure we run it asynchroneosly so that client code
        	// always expects it
        	timeoutId = setTimeout(() => callback(features), 0);
        }	

        this.stop = () => {
        	clearTimeout(timeoutId);
        }
    }

}