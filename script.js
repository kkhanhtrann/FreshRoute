//  ===================================================== //
//  ================== RUNNING SECTION ================== //
//  ===================================================== //

const map = L.map('map', { zoomControl: false }).setView([40.7608, -111.8910], 13); // Salt Lake City
let currentLat = 40.7608; // Default latitude
let currentLon = -111.8910; // Default longitude

let targetLat = null; // Default target latitude
let targetLon = null; // Default target longitude

let graph = null; // Will be set after the graph is built
let edges = null; // Will be set after the edges are extracted

let routeLines = null; // Will be used to store the drawn route lines
trackCurrentLocation(map);
let lastWeatherUpdate = null; // Variable to store the last weather data
let cachedWeatherGrid = null; // Variable to store the cached weather data
const WEATHER_TTL_MS = 2 * 60 * 60 * 1000; // 2 hour

// Set up bias for geocoding
// This is the viewbox for Salt Lake City, Utah
const slcLat = 40.7608;
const slcLon = -111.8910;
const boxSize = 0.1; // ~10km radius

const viewbox = [
    slcLon - boxSize, slcLat + boxSize,  // top-left (NW)
    slcLon + boxSize, slcLat - boxSize   // bottom-right (SE)
].join(',');

//================================================== 
//Search bar for geocoding
let searchMarker = null; // global reference
L.Control.geocoder({
    position: 'topleft',
    geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {
            viewbox: viewbox,
            bounded: 1,
            addressdetails: 1
        }
    }),
    defaultMarkGeocode: false,
    collapsed: true
})
    .on('markgeocode', function (e) {
        const center = e.geocode.center;
        map.setView(center, 16);

        // Remove old marker if exists
        if (searchMarker) {
            map.removeLayer(searchMarker);
        }
        // Add new marker
        searchMarker = L.marker(center).addTo(map)
            .bindPopup(e.geocode.name)
            .openPopup();

        // Update target coordinates
        targetLat = center.lat;
        targetLon = center.lng;
        drawRoute();

    })
    .addTo(map);
//==================================================

//================================================== 
//Changing map texture button control
const streets = L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

const satellite = L.tileLayer('http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

const changeMapTexture = L.Control.extend({
    options: {
        position: 'bottomleft' // Or any corner
    },

    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control change-map-texture');

        container.style.backgroundColor = 'white';
        container.style.padding = '5px';
        container.style.cursor = 'pointer';
        container.innerHTML = '🗺️';

        let isSatellite = false;

        container.addEventListener('dblclick', (e) => e.stopPropagation());

        container.onclick = function () {
            if (isSatellite) {
                map.removeLayer(satellite);
                streets.addTo(map);
                container.innerHTML = '🗺️';
            } else {
                map.removeLayer(streets);
                satellite.addTo(map);
                container.innerHTML = '🌍';
            }
            isSatellite = !isSatellite;
        };

        return container;
    }
});

map.addControl(new changeMapTexture());
//==================================================

//==================================================
//Position of + - zoom buttons
L.control.zoom({ position: 'topleft' }).addTo(map);
//==================================================

// ==== TESTING DRAW OUT THE COVERED AREA ==== // 
// fetch('routeData/whole_slc_walks.geojson')
//     .then(response => response.json())
//     .then(data => {
//         // Add to map
//         L.geoJSON(data, {
//             style: {
//                 color: '#DC143C',
//                 weight: 2
//             }
//         }).addTo(map);
//     })
//     .catch(err => console.error('Failed to load GeoJSON:', err));
// ==== TESTING DRAW OUT THE COVERED AREA ==== //

// NOTE: geoJson order is [lon, lat] but leaflet uses [lat, lon]
let componentMap = null; // Will be set after the graph is built
fetch('routeData/whole_slc_walks.geojson')
    .then(response => response.json())
    .then(async data => {
        edges = extractEdges(data);

        // Assigning the weather data to the edges
        //await refreshWeatherData();

        // built the graph from edges
        graph = buildGraph(edges);
        componentMap = computeConnectedComponents(graph);

        // // Begin testing
        // const startCoord = [40.7608, -111.8910]; // Near downtown/library
        // const endCoord = [40.7652, -111.8808]; // Toward University/600 S
        // const path = dijkstra(graph, startCoord, endCoord);
        // const latlngs = path.map(node => {
        //     const [lat, lng] = node.split(',').map(Number);
        //     return [lat, lng]; // Leaflet expects [lat, lng]
        // });
        // // Draw the path on the map
        // L.polyline(latlngs, { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);

        // // End testing
    })
    .catch(err => console.error('Failed to load GeoJSON:', err));


//  ======================================================= //
//  ================== UTILITY FUNCTIONS ================== //
//  ======================================================= //

async function refreshWeatherData() {
    // Check if weather needs to be refreshed
    const now = Date.now();
    if (!cachedWeatherGrid || (now - lastWeatherUpdate > WEATHER_TTL_MS)) {
        console.log("refreshing...");
        cachedWeatherGrid = await fetchWeatherGrid();
        lastWeatherUpdate = now;
    } else {
        console.log(" Using cached weather data.");
        return; // No need to refresh
    }
}

function drawRoute() {
    fetch('routeData/whole_slc_walks.geojson')
        .then(response => response.json())
        .then(async _ => {
            //refreshWeatherData();
            // Rebuild the graph with updated weather data
            graph = buildGraph(edges);
            const path = dijkstra(graph, [currentLat, currentLon], [targetLat, targetLon]);
            const latlngs = path.map(node => {
                const [lat, lng] = node.split(',').map(Number);
                return [lat, lng]; // Leaflet expects [lat, lng]
            });

            if (routeLines) {
                // Remove the previous route lines if they exist
                map.removeLayer(routeLines);
            }
            routeLines = L.polyline(latlngs, { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
        })
        .catch(err => console.error('Failed to load GeoJSON:', err));
}

/**
 * Reads in a geojson file and converts the (lat, long) 
 * pairs into edges for the backend graph
 */
function extractEdges(geojson) {
    const edges = [];
    geojson.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        if (feature.geometry.type === 'LineString') {

            // Loop through each coordinate in the LineString
            for (let i = 0; i < coordinates.length - 1; i++) {
                const from = coordinates[i];
                const to = coordinates[i + 1];

                // Edge object
                const edge = {
                    from: from,
                    to: to,
                    distance: haversineDistanceKM(from[1], from[0], to[1], to[0]),
                    pm2_5: 0, // Set this as default but we should update this when fetching the data
                    temperature: 0, // Set this as default but we should update this when fetching the data
                    humidity: 0 // Set this as default but we should update this when fetching the data
                };

                // Add the edge 
                edges.push(edge);
            }
        }
    });
    return edges;
}

// Do not ask me how I know this, I pulled this from StackOverflow
// But basically what Haversine does is it takes two points on a sphere and calculates the distance between them
function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }

    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const { sin, cos, sqrt, atan2 } = Math;

    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
        + cos(lat1) * cos(lat2)
        * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;
    return d; // distance in km
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
function buildGraph(edges) {
    const graph = {};
    edges.forEach(edge => {
        const { from, to, distance, pm2_5 } = edge;

        // Using lat, lon as keys
        const fromKey = `${from[1]},${from[0]}`;
        const toKey = `${to[1]},${to[0]}`;

        const fromWeather = getClosestWeather(from[1], from[0], cachedWeatherGrid);
        const toWeather = getClosestWeather(to[1], to[0], cachedWeatherGrid);

        if (!graph[fromKey]) {
            graph[fromKey] = {};
        }
        if (!graph[toKey]) {
            graph[toKey] = {};
        }

        graph[fromKey][toKey] = {
            distance,
            pm2_5,
            temperature: cachedWeatherGrid && cachedWeatherGrid[fromWeather] ? cachedWeatherGrid[fromWeather].temp : 23,
            humidity: cachedWeatherGrid && cachedWeatherGrid[fromWeather] ? cachedWeatherGrid[fromWeather].humidity : 50
        };
        graph[toKey][fromKey] = {
            distance,
            pm2_5,
            temperature: cachedWeatherGrid && cachedWeatherGrid[toWeather] ? cachedWeatherGrid[toWeather].temp : 23,
            humidity: cachedWeatherGrid && cachedWeatherGrid[fromWeather] ? cachedWeatherGrid[fromWeather].humidity : 50
        };
    });
    return graph;
}

/**
 * Finds the shortest path from the users starting position to their desired destination
 * based on the haversine distance (need to modify logic to account for AQI in weighting)
 */
function dijkstra(graph, startNode, endNode) {
    const distances = {};
    const previous = {};
    const queue = new PriorityQueue();

    for (const node in graph) {
        distances[node] = Infinity;
        previous[node] = null;
    }
    startNode = getClosestNode(graph, startNode[0], startNode[1]);
    endNode = getClosestNode(graph, endNode[0], endNode[1], startNode);

    distances[startNode] = 0;
    queue.enqueue(startNode, 0);

    while (!queue.isEmpty()) {
        const currentNode = queue.dequeue().element;

        if (currentNode === endNode) {
            break;
        }

        for (const neighbor in graph[currentNode]) {

            // TODO:
            // This later will be the logic to determine the cleanest path
            // basically the logic to determine if a edge have less weight
            // than the current one
            const candidatePath = distances[currentNode] + graph[currentNode][neighbor].distance;

            if (candidatePath < distances[neighbor]) {
                distances[neighbor] = candidatePath;
                previous[neighbor] = currentNode;
                queue.enqueue(neighbor, candidatePath);
            }
        }
    }

    // Reconstruct path as a list of nodes from start to end
    const path = [];
    let current = endNode;
    while (current) {
        path.unshift(current);
        current = previous[current];
    }
    if (path[0] !== startNode) {
        return []; // No path found
    }
    return path;
}

/**
 * If the user places their destination location not within the geoJSON
 * valid walking paths, it places their destination as the closest existing node.
 */
function getClosestNode(graph, lat, lon, startingNode = null) {
    let closestNode = null;
    let minDistance = Infinity;

    const targetComponent = startingNode ? componentMap[startingNode] : null;

    for (const node in graph) {
        if (startingNode && componentMap[node] !== targetComponent) continue;

        const [nodeLat, nodeLon] = node.split(',').map(Number);
        const distance = haversineDistanceKM(lat, lon, nodeLat, nodeLon);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}

function areNodesConnected(graph, nodeA, nodeB) {
    const visited = new Set();

    function dfs(node) {
        if (node === nodeB) return true;
        visited.add(node);

        for (const neighbor in graph[node]) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) return true;
            }
        }
        return false;
    }

    return dfs(nodeA);
}

function computeConnectedComponents(graph) {
    const visited = new Set();
    const componentMap = {};
    let componentId = 0;

    for (const node in graph) {
        if (!visited.has(node)) {
            const queue = [node];
            visited.add(node);
            componentMap[node] = componentId;

            while (queue.length > 0) {
                const current = queue.shift();

                for (const neighbor in graph[current]) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                        componentMap[neighbor] = componentId;
                    }
                }
            }

            componentId++;
        }
    }

    return componentMap;
}

function getClosestWeather(lat, lon, weatherData) {
    let closestNode = null;
    let minDistance = Infinity;

    for (const key in weatherData) {
        const [nodeLat, nodeLon] = key.split(',').map(Number);
        const distance = haversineDistanceKM(lat, lon, nodeLat, nodeLon);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = key;
        }
    }

    return closestNode;
}

function trackCurrentLocation(map) {
    let marker = null;

    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    navigator.geolocation.watchPosition(
        position => {
            const latlng = [position.coords.latitude, position.coords.longitude];
            currentLat = position.coords.latitude; // Update global lat
            currentLon = position.coords.longitude; // Update global lon
            if (!marker) {
                const icon = L.divIcon({
                    className: '',
                    html: `
                        <div class="location-marker">
                            <div class="pulse"></div>
                            <div class="dot"></div>
                        </div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                marker = L.marker(latlng, { icon }).addTo(map);
                map.setView(latlng, 13);
            } else {
                marker.setLatLng(latlng);
                //map.setView(latlng, map.getZoom());
            }
        },
        err => {
            console.error("Geolocation error:", err);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000
        }
    );
}


// GPT-ed version of the fetchWeatherGrid function
// It use concurrency to fetch weather data for a grid of points over Salt Lake City.
// DO NOT USE THIS DURING DEVELOPMENT, IT WILL BLOCK YOUR IP

// async function fetchWeatherGrid(dayInAdvance = 1, targetHour = 14) {
//     const grid = [];
//     const weatherData = {};
//     const latStart = 40.68, latEnd = 40.83, latStep = 0.01;
//     const lonStart = -112.05, lonEnd = -111.80, lonStep = 0.01;
//     const targetIndex = (dayInAdvance - 1) * 24 + targetHour;

//     for (let lat = latStart; lat <= latEnd; lat += latStep) {
//         for (let lon = lonStart; lon <= lonEnd; lon += lonStep) {
//             grid.push({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) });
//         }
//     }

//     // Limit concurrency to 10
//     const CONCURRENCY_LIMIT = 10;
//     const chunks = [];
//     for (let i = 0; i < grid.length; i += CONCURRENCY_LIMIT) {
//         chunks.push(grid.slice(i, i + CONCURRENCY_LIMIT));
//     }

//     for (const chunk of chunks) {
//         const requests = chunk.map(async point => {
//             const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&hourly=temperature_2m,relative_humidity_2m&forecast_days=${dayInAdvance}&timezone=auto`;

//             try {
//                 const res = await fetch(url);
//                 const data = await res.json();
//                 const temp = data.hourly.temperature_2m?.[targetIndex];
//                 const humidity = data.hourly.relative_humidity_2m?.[targetIndex];

//                 if (temp !== undefined && humidity !== undefined) {
//                     const key = `${point.lat.toFixed(2)},${point.lon.toFixed(2)}`;
//                     weatherData[key] = { temp, humidity };
//                 }
//             } catch (err) {
//                 console.error(`Failed to fetch weather for ${point.lat}, ${point.lon}`, err);
//             }
//         });

//         await Promise.allSettled(requests); // Run all in parallel (per chunk)
//     }

//     return weatherData;
//}



// ============== THIS WAS TOO SLOW SO I GPT-ED THE ABOVE FUNCTION ============== //

// NOTE: USE THIS DURING DEVELOPMENT
// /**
//  * Fetches temperature and humidity data from Open-Meteo for a grid over Salt Lake City.
//  * defaults to fetching data for the next day at 2 PM.
//  * Returns a map keyed by "lat,lon" string with weather data.
//  */
async function fetchWeatherGrid(dayInAdvance = 1, targetHour = 14) {
    const grid = [];
    const weatherData = {};
    const latStart = 40.68, latEnd = 40.83, latStep = 0.01; // 0.01 degrees is about 1.11 km at this latitude
    const lonStart = -112.05, lonEnd = -111.80, lonStep = 0.01; // 0.01 degrees is about 1.11 km at this latitude
    const targetIndex = (dayInAdvance - 1) * 24 + targetHour;

    for (let lat = latStart; lat <= latEnd; lat += latStep) {
        for (let lon = lonStart; lon <= lonEnd; lon += lonStep) {
            grid.push({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
        }
    }

    for (const point of grid) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&hourly=temperature_2m,relative_humidity_2m&forecast_days=${dayInAdvance}&timezone=auto`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const temp = data.hourly.temperature_2m?.[targetIndex];
            const humidity = data.hourly.relative_humidity_2m?.[targetIndex];

            if (temp !== undefined && humidity !== undefined) {
                const key = `${point.lat},${point.lon}`;
                weatherData[key] = {
                    temp,
                    humidity
                };
            }
        } catch (err) {
            console.error(`Failed to fetch weather for ${point.lat}, ${point.lon}`, err);
        }

        // Rate limiting to avoid being blocked
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return weatherData;
}

// ============== THIS WAS TOO SLOW SO I GPT-ED THE ABOVE FUNCTION ============== //



// I GPT-ed this class
/**
 * Used in dijkstra's
 */
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift(); // Always removes the one with lowest priority
    }

    isEmpty() {
        return this.items.length === 0;
    }
}
