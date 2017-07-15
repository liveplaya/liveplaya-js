import {parseGeojson} from '../formats';
import {request} from 'd3-request';

export
class AjaxDataSource {
    constructor(url, pollInterval, notify) {
        let timeoutId = null;
        let features = [];
    	const req = request(url)
                 .mimeType("application/json")
                 .response(xhr => JSON.parse(xhr.responseText));

        if (pollInterval === null || pollInterval === undefined) {
            pollInterval = 5;
        }

        const onresponse = (jsondata) => {
        	if (!jsondata) {
        		console.error('Failed to get data from ' + url);
        	} else {
        		features = parseGeojson(jsondata);
        		notify(features);
        	}
    		timeoutId = setTimeout(() => req.get(onresponse), pollInterval*1000);
        };

        this.stop = () => {
            clearTimeout(timeoutId);
            req.abort();            
        }

        Object.defineProperty(this, 'features', {
            get: () => features,
            enumerable: true,
        });

        req.get(onresponse);
    }
}