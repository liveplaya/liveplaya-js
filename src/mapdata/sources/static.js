import {parseGeojson} from '../formats';

export
class StaticDataSource {
    constructor(data) {
    	this.features = parseGeojson(data);
  
        this.stop = () => {
        }
    }

}