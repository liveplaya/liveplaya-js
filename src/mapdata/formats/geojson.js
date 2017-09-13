import {fromFeet, getLocation, normalizeAngle} from '../../math';
import {Feature, City, CStreet, TStreet, Promenande, Plaza, RodsRoad, Fence, Art, Vehicle, APRSStation, Marker} from '../features';
import {Clock} from '../address';

function lastSeen(feat) {
    return feat.properties.lastseen ? new Date(feat.properties.lastseen*1000) : null;
};

export 
function parseGeojson(data) {
    let dataFeatures = null;
    if (data.type == 'Feature') {
        dataFeatures = [data];
    } 
    else if (data.type == 'FeatureCollection') {
        dataFeatures = data.features;
    }
    else {
        throw new Error('GeoJSON data must be of type Feature or FeatureCollection');           
    }

    const parsedFeatures = [];
    for(let df of dataFeatures) {
        if (!df.properties) {
            df.properties = {}
        }
        if (df.properties.brc == 'city') {
            const c = df.properties;
            const city = new City(c.year, df.geometry.coordinates, Clock.toRadians(c.northSouthAxisHour, c.northSouthAxisMinute));
            parsedFeatures.push(city);

            for(let i=0; i<c.streetNames.length; ++i) {
                parsedFeatures.push(new CStreet(city, 
                    c.streetNames[i], 
                    fromFeet(c.streetRadiusesFt[i]), 
                    fromFeet(c.regularStreetWidthFt)));
            }
            city.esplanade = new CStreet(city, 'Esplanade', fromFeet(c.esplanadeRadiusFt),
                fromFeet(c.esplanadeWidthFt));
            parsedFeatures.push(city.esplanade);
            for(let hour=2; hour <= 10; ++hour) {
                for(let minute of hour == 10 ? [0] : [0, 15, 30, 45]) {
                    let direction = new Clock(hour, minute);
                    let street = new TStreet(city, direction, fromFeet(c.regularStreetWidthFt));
                    parsedFeatures.push(street);
                }
            }
            parsedFeatures.push(new Promenande(city, new Clock(3,0), fromFeet(c.promenandeWidthFt)));
            parsedFeatures.push(new Promenande(city, new Clock(6,0), fromFeet(c.promenandeWidthFt)));
            parsedFeatures.push(new Promenande(city, new Clock(9,0), fromFeet(c.promenandeWidthFt)));
            parsedFeatures.push(new Promenande(city, new Clock(12,0), fromFeet(c.promenandeWidthFt)));

            city.fence = new Fence(city, fromFeet(c.pentagonPointsDistanceFt));
            parsedFeatures.push(city.fence);
            parsedFeatures.push(new RodsRoad(city, fromFeet(c.centerCampDistanceFt), fromFeet(c.rodsRoadRadiusFt), fromFeet(c.rodsRoadWidth)));

            parsedFeatures.push(new Plaza(city, 'Center Camp Plaza', 6, 0, fromFeet(c.centerCampDistanceFt), fromFeet(c.centerCampPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '3:00 Civic Plaza', 3, 0, fromFeet(c.civicPlazaDistanceFt), fromFeet(c.civicPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '9:00 Civic Plaza', 9, 0, fromFeet(c.civicPlazaDistanceFt), fromFeet(c.civicPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '3:00 Public Plaza', 3, 0, fromFeet(c.publicPlaza3DistanceFt), fromFeet(c.publicPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '6:00 Public Plaza', 6, 0, fromFeet(c.publicPlaza6DistanceFt), fromFeet(c.publicPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '9:00 Public Plaza', 9, 0, fromFeet(c.publicPlaza9DistanceFt), fromFeet(c.publicPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '4:30 Art Plaza', 4, 30, fromFeet(c.artPlazaDistanceFt), fromFeet(c.artPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, '7:30 Art Plaza', 7, 30, fromFeet(c.artPlazaDistanceFt), fromFeet(c.artPlazaRadiusFt)));
            parsedFeatures.push(new Plaza(city, 'Man Plaza', 0, 0, 0, fromFeet(100)));

            let templeDistance = fromFeet(2500);
            parsedFeatures.push(new Plaza(city, 'Temple Plaza', 0, 0, templeDistance, fromFeet(100)));
        }
        else if (df.properties.brc == 'art') {
            parsedFeatures.push(new Art(city, df.properties.name, df.geometry.coordinates));
        }
        else if (df.properties.vehicle) {
            parsedFeatures.push(new Vehicle(df.id, df.properties.name, df.properties.vehicle, {
                trackerId: df.properties.tracker,
            }));
        }
        else if (df.properties.aprs == 'station') {
            parsedFeatures.push(new APRSStation(df.properties.callsign, {
                lastseen:lastSeen(df), 
                coords:df.geometry ? df.geometry.coordinates : null,
                rawPacket: df.properties.rawpacket,
                symbol: df.properties.symbol,
                comment: df.properties.comment,
                path: df.properties.path,
            }));
        }
        else if (df.properties.aprs) {
            // legacy format
            parsedFeatures.push(new APRSStation(df.properties.aprs, {
                lastseen:lastSeen(df), 
                coords:df.geometry ? df.geometry.coordinates : null,
                rawPacket: df.properties.rawpacket,
                symbol: df.properties.symbol,
                comment: df.properties.comment,
                path: df.properties.path,
            }));
        }
        else if (df.geometry && df.geometry.type == 'Point') {
            parsedFeatures.push(new Marker(df.geometry.coordinates, {
                name:df.properties.name, 
                id:df.id, 
                lastseen:lastSeen(df)
            }));
        }
        else {
            parsedFeatures.push(new Feature(df.id).setGeometry(df.geometry).setProperties(df.properties));
        }
    }
    return parsedFeatures;
}        
