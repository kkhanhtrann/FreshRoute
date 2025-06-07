import { state } from './state.js';
import { drawRoute } from './routing.js';
import { haversineDistanceKM } from './utils.js';

export function trackCurrentLocation(map) {
    let marker = null;

    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    navigator.geolocation.watchPosition(
        position => {
            const latlng = [position.coords.latitude, position.coords.longitude];
            state.currentLat = position.coords.latitude; // Update global lat
            state.currentLon = position.coords.longitude; // Update global lon

            redrawRouteIfMovedEnough(map);

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

function redrawRouteIfMovedEnough(map) {
    const lat1 = state.currentLat;
    const lon1 = state.currentLon;
    const lat2 = state.previousLat;
    const lon2 = state.previousLon;

    if (haversineDistanceKM(lat1, lon1, lat2, lon2) >= 0.005) {
        console.log("Redrawing route!");
        if (state.graph && state.liveTracking)
            drawRoute(map);
        state.previousLat = state.currentLat;
        state.previousLon = state.currentLon;
    }
}