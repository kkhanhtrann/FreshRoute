export const state = {
    currentLat: 40.7608, // Default latitude
    currentLon: -111.8910, // Default longitude

    liveTracking: false, // Flag for live tracking mode

    map: null, // Will be set when the map is initialized
    siderbar: null, //Leaflet V2 Sidebar
    previousLat: 40.7608,
    previousLon: -111.8910,

    beginLat: 40.7608, // Default beginning latitude
    beginLon: -111.8910, // Default beginning longitude

    targetLat: null, // Default target latitude
    targetLon: null, // Default target longitude

    graph: null, // Will be set after the graph is built
    edges: null, // Will be set after the edges are extracted
    componentMap: null, // Will be set after the graph is built

    currentHourIndex: 14, // Default hour index for weather data (2 PM)
    currentDayInAdvance: 1, // Default day in advance for weather data
    cachedWeatherGrid: null, // Variable to store the cached weather data

    redSearchMarker: null, // Red marker for search results
    greenSearchMarker: null, // Green marker for destination


    greenCheckbox: true,
    yellowCheckbox: true,
    orangeCheckbox: true,
    redCheckbox: true,
    purpleCheckbox: true,
    maroonCheckbox: true,

    sensors: null
}