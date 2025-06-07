import { haversineDistanceKM } from './utils.js';

/**
 * Reads in a geojson file and converts the (lat, long) 
 * pairs into edges for the backend graph
 */
export function extractEdges(geojson) {
    const edges = [];
    geojson.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        if (feature.geometry.type === 'LineString') {

            // Loop through each coordinate in the LineString
            for (let i = 0; i < coordinates.length - 1; i++) {
                const from = coordinates[i];
                const to = coordinates[i + 1];

                // Midpoint of the edge
                const midLat = (from[1] + to[1]) / 2;
                const midLon = (from[0] + to[0]) / 2;

              

                // Edge object
                const edge = {
                    from: from,
                    to: to,
                    distance: haversineDistanceKM(from[1], from[0], to[1], to[0]),
                    pm2_5: 0, // Set this as default but we should update this when fetching the data     
                    temperature: 0, // Not stored in the edge atm
                    humidity: 0 // Not stored in the edge atm
                };

                // Add the edge 
                edges.push(edge);
            }
        }
    });
    return edges;
}

/**
 * Creates a backend graph representation of the walking paths in Utah
 * 
 * How the edge weights should be calculated:
 * (lat, long)  <------------>  (lat, long)
 *  pm 2.5: x    w: (x + y)/2    pm 2.5: y
 * 
 *  graph[from][tokey].pm2_5 = (from.pm2_5 + to.pm2_5)/2;
 * 
 * The edge looks like this atm: if you call graph[from][to]
 * (lat1, lon1)  <------------>  (lat2, lon2)
 *  pm2.5: 0       w: distance km   pm2.5: 0
 *  temp: t1                        temp: t2 (not stored)
 *  humidity: h1                    humidity: h2 (not stored)
 * You will get an object like this:
 * {
 * distance: <number>,         // distance in kilometers
 * pm2_5: 0,                   // currently hardcoded as 0
 * temperature: <from_temp>,   // temperature at the `from` node (t1)
 * humidity: <from_humidity>   // humidity at the `from` node (h1)
 * }
 */
export function buildGraph(edges) {
    const graph = {};
    edges.forEach(edge => {
        const { from, to, distance, pm2_5, temperature, humidity } = edge;

        // Using lat, lon as keys
        const fromKey = `${from[1]},${from[0]}`;
        const toKey = `${to[1]},${to[0]}`;

        if (!graph[fromKey]) graph[fromKey] = {};
        if (!graph[toKey]) graph[toKey] = {};

        graph[fromKey][toKey] = {
            distance,
            pm2_5,
            temperature,
            humidity
            
        };
        graph[toKey][fromKey] = {
            distance,
            pm2_5,
            temperature,
            humidity
        };
    });

    return graph;
}
