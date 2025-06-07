import { getClosestWeather } from './utils.js';

// This file implements a Web Worker API for processing edge data with weather information.
// The worker receives a message containing edges and a weather grid, enriches each edge
// with the closest weather data, and posts the updated edges back to the main thread.
// Listen for messages from the main thread
self.onmessage = function (e) {
    const data = e.data;
    const edges = data?.edges;
    const weatherData = data?.weatherData;

    // Validate input 
    if (!edges || !weatherData) {
        throw new Error("Missing edges or weatherData in worker input.");
    }

    // Iterate through each edge
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        // Calculate the midpoint latitude and longitude of the edge
        const midLat = (edge.from[1] + edge.to[1]) / 2;
        const midLon = (edge.from[0] + edge.to[0]) / 2;

        // Find the closest weather data point to the edge midpoint
        const key = getClosestWeather(midLat, midLon, weatherData);
        const weather = weatherData[key];
        // Attach temperature and humidity to the edge, or null if unavailable
        edge.temperature = weather?.temp ?? 23;
        edge.humidity = weather?.humidity ?? 35;
        edge.pm2_5 = weather?.pm2_5 ?? 0;
    }

    // Send the enriched edges back to the main thread
    postMessage(edges);
};
