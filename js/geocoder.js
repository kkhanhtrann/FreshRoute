import { state } from './state.js';
import { SLC_VIEWBOX } from './config.js';
import { drawRoute } from './routing.js';

export function setupGeocoder(map) {
    L.Control.geocoder({
        position: 'topright',
        geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: {
                viewbox: SLC_VIEWBOX,
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

            // Clear previous markers if they exist
            if (state.redSearchMarker) {
                state.map.removeLayer(state.redSearchMarker);
            }
            if (state.greenSearchMarker) {
                state.map.removeLayer(state.greenSearchMarker);
            }
            // Add new marker
            state.greenSearchMarker = L.marker(center).addTo(map)
                .bindPopup(e.geocode.name)
                .openPopup();

            // Update target coordinates
            state.targetLat = center.lat;
            state.targetLon = center.lng;

            state.liveTracking = true; // Enable live tracking after geocoding

            drawRoute(map, 0, new Date().getHours());
        })
        .addTo(map);

    document.getElementById('routeBtn').addEventListener('click', function () {
        const fromInput = document.getElementById('from-input').value;
        const toInput = document.getElementById('to-input').value;

        console.log('From:', fromInput);
        console.log('To:', toInput);
    });
}