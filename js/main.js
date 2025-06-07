// This file is the main entry point for the JavaScript application.
import { initMap } from './map.js';
import { trackCurrentLocation } from './location.js';
import { setupGeocoder } from './geocoder.js';
import { extractEdges, buildGraph } from './graph.js';
import { state } from './state.js';
import { computeConnectedComponents } from './pathfinding.js';
import { refreshWeatherData } from './weather.js';
import { initAQIControl } from './AQIcontrol.js';
import { initDateSelect, initTimeDropdown, initDroppablePin } from './planRoute.js';
import { loadSensors } from './utils.js';

const map = initMap();
initAQIControl(map);
setupGeocoder(map);
trackCurrentLocation(map);
loadGraphData();
initDateSelect();
initTimeDropdown();
initDroppablePin(map);

async function loadGraphData() {
    const res = await fetch('routeData/whole_slc_walks.geojson');
    const data = await res.json();

    state.sensors = await loadSensors();
    state.edges = extractEdges(data);
    await refreshWeatherData(0, new Date().getHours());
    const graph = buildGraph(state.edges);
    state.graph = graph;
    state.componentMap = computeConnectedComponents(graph);
}