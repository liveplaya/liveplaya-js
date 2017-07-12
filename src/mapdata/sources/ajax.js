import {parseGeojson} from '../formats';
import {request} from 'd3-request';

export
class AjaxDataSource {
    constructor(url, refreshInterval) {
    	let notify = () => {};
        let timeoutId = null;
    	const req = request(url)
                 .mimeType("application/json")
                 .response(xhr => JSON.parse(xhr.responseText));

        const onresponse = (jsondata) => {
        	if (!jsondata) {
        		console.error('Failed to get data from ' + url);
        		notify([]);
        	} else {
        		const features = parseGeojson(jsondata);
        		notify(features);
        	}
    		timeoutId = setTimeout(() => req.get(onresponse), refreshInterval*1000);
        };

        this.query = (callback) => {
			this.stop();
			notify = callback;
	        req.get(onresponse);
        }

        this.stop = () => {
	        clearTimeout(timeoutId);
	    	req.abort();        	
        }

    }
}