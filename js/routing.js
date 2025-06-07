import { state } from './state.js';
import { buildGraph } from './graph.js';
import { dijkstra } from './pathfinding.js';
import { refreshWeatherData } from './weather.js';

let routeLines = null; // Will be used to store the drawn route lines

export async function drawRoute(map, dayInAdvance = 0, hourIndex = 14) {

    await refreshWeatherData(dayInAdvance, hourIndex);
    // Rebuild the graph with updated weather data

    state.graph = buildGraph(state.edges);

    let path = null;
    if (!state.liveTracking)
        path = dijkstra(state.graph, [state.beginLat, state.beginLon], [state.targetLat, state.targetLon]);
    else
        path = dijkstra(state.graph, [state.currentLat, state.currentLon], [state.targetLat, state.targetLon]);

    const latlngs = path.map(node => {
        const [lat, lng] = node.split(',').map(Number);
        return [lat, lng]; // Leaflet expects [lat, lng]
    });

    if (routeLines) {
        // Remove the previous route lines if they exist
        console.log("Removing route lines!");
        map.removeLayer(routeLines);
    }

    routeLines = L.polyline(latlngs, { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);

    if(path.length === 0)
    {
        setTimeout(() => {alert("Could not find a path with the current selected settings!");}, 0);
    }
}