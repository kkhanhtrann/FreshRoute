import { SLC_VIEWBOX } from './config.js';
import { state } from './state.js';
import { drawRoute } from './routing.js';

//leaflet color markers custom
const redIcon = new L.Icon({
    iconUrl: 'images/redPin.png',
    shadowUrl: 'images/marker-shadow.png',
    iconSize: [41, 41],
    iconAnchor: [12, 40],
    popupAnchor: [9, -34],
    shadowSize: [41, 41],
    shadowAnchor: [3, 39]
});

const greenIcon = L.icon({
    iconUrl: 'images/greenPin.png',
    shadowUrl: 'images/marker-shadow.png',
    iconSize: [41, 41],
    iconAnchor: [12, 40],
    popupAnchor: [9, -34],
    shadowSize: [41, 41],
    shadowAnchor: [3, 39]
});

//https://github.com/pointhi/leaflet-color-markers
var greenMarker = new L.Icon({
  iconUrl: 'images/marker-icon-green.png',
  shadowUrl: 'images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

let targetDateInput = 0;
export function initDateSelect() {
    const select = document.getElementById("date-select");
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const option = document.createElement("option");
        option.value = date.toISOString().split("T")[0]; // YYYY-MM-DD
        option.textContent = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric"
        });

        // If it's today, add "(Today)" to the option text
        if (i === 0) {
            option.textContent += " (Today)";
        }

        // Store the index as a data attribute
        option.dataset.index = i;

        select.appendChild(option);
    }

    // Listen for changes and update targetDateInput
    select.addEventListener("change", function () {
        const selectedOption = select.options[select.selectedIndex];
        targetDateInput = parseInt(selectedOption.dataset.index, 10);
        console.log(targetDateInput);
    });
}


let targetTimeInput = 14; // Default to 2 PM
export function initTimeDropdown() {
    const timeSelect = document.getElementById("time-select");

    for (let hour = 0; hour < 24; hour++) {
        const option = document.createElement("option");

        // Format like "1 AM", "2 PM", etc.
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour < 12 ? "AM" : "PM";

        option.value = hour;
        option.textContent = `${hour12} ${ampm}`;

        if (hour === 14) {
            option.selected = true;
        }

        timeSelect.appendChild(option);
    }

    // Listen for changes and update targetTimeInput
    timeSelect.addEventListener("change", function () {
        targetTimeInput = parseInt(timeSelect.value, 10);
        console.log(targetTimeInput);
    });
}

// =============================================================== //
// ======================== Route Planning ======================== //
// =============================================================== //
// Initialize date and time dropdowns
const fromInput = document.getElementById("from-input");
const fromSuggestions = document.getElementById("from-suggestions");
let fromCoordinate = null;
let debounceTimeout = null;
fromInput.addEventListener("input", () => {
    const query = fromInput.value.trim();
    clearTimeout(debounceTimeout);

    if (query.length < 3) {
        fromSuggestions.innerHTML = "";
        return;
    }

    debounceTimeout = setTimeout(async () => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=${SLC_VIEWBOX}&bounded=1&addressdetails=1`;
        console.log("Fetching suggestions from:", url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            fromSuggestions.innerHTML = "";
            data.forEach(place => {
                const option = document.createElement("div");
                option.textContent = place.display_name;
                option.classList.add("suggestion-item");
                option.addEventListener("click", () => {
                    fromInput.value = place.display_name;
                    fromCoordinate = [place.lat, place.lon];
                    fromInput.dataset.lat = place.lat;
                    fromInput.dataset.lon = place.lon;
                    fromSuggestions.innerHTML = "";
                });
                fromSuggestions.appendChild(option);
            });
        } catch (err) {
            console.error("Failed to fetch suggestions:", err);
        }
    }, 400);
});


const toInput = document.getElementById("to-input");
const toSuggestions = document.getElementById("to-suggestions");
let toCoordinate = null;
let toDebounceTimeout = null;
toInput.addEventListener("input", () => {
    const query = toInput.value.trim();
    clearTimeout(toDebounceTimeout);

    if (query.length < 3) {
        toSuggestions.innerHTML = "";
        return;
    }

    toDebounceTimeout = setTimeout(async () => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=${SLC_VIEWBOX}&bounded=1&addressdetails=1`;
        console.log("Fetching suggestions from:", url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            toSuggestions.innerHTML = "";
            data.forEach(place => {
                const option = document.createElement("div");
                option.textContent = place.display_name;
                option.classList.add("suggestion-item");
                option.addEventListener("click", () => {
                    toInput.value = place.display_name;
                    toCoordinate = [place.lat, place.lon];
                    toInput.dataset.lat = place.lat;
                    toInput.dataset.lon = place.lon;
                    toSuggestions.innerHTML = "";
                });
                toSuggestions.appendChild(option);
            });
        } catch (err) {
            console.error("Failed to fetch suggestions:", err);
        }
    }, 400);
});
// =============================================================== //
// ======================== Route Planning ======================== //
// =============================================================== //

// Find Route button
const findRouteButton = document.getElementById("routeBtn");
findRouteButton.addEventListener("click", () => {
    if (!fromCoordinate || !toCoordinate) {
        alert("Please select both start and end locations.");
        return;
    }

    state.beginLat = parseFloat(fromInput.dataset.lat);
    state.beginLon = parseFloat(fromInput.dataset.lon);
    state.targetLat = parseFloat(toInput.dataset.lat);
    state.targetLon = parseFloat(toInput.dataset.lon);

    // Here you would call your route planning function
    state.liveTracking = false; // Enable live tracking after route planning
    drawRoute(state.map, targetDateInput, targetTimeInput);

    // Clear previous markers if they exist
    if (state.redSearchMarker) {
        state.map.removeLayer(state.redSearchMarker);
    }
    if (state.greenSearchMarker) {
        state.map.removeLayer(state.greenSearchMarker);
    }

    if(markerFrom)
    {
        state.map.removeLayer(markerFrom);
    }
    if(markerTo)
    {
        state.map.removeLayer(markerTo);
    }

    // Add new marker at starting location
    const fromLatLng = [state.beginLat, state.beginLon];
    state.redSearchMarker = L.marker(fromLatLng, {
            icon: redIcon
        }).addTo(state.map)
        .bindPopup(fromInput.value);

    // Add new marker at destination
    const destinationLatLng = [state.targetLat, state.targetLon];
    state.greenSearchMarker = L.marker(destinationLatLng, {
            icon: greenMarker
        }).addTo(state.map)
        .bindPopup(toInput.value)
        .openPopup();
});

// Marker variable
let markerFrom;
let markerTo;
export function initDroppablePin(map){
    // Drop From pin button
    document.getElementById('fromPin').addEventListener('click', () => {
        if (markerFrom) map.removeLayer(markerFrom); // Remove old marker if it exists

        // Create draggable marker at center
        const center = map.getCenter();
        markerFrom = L.marker(center, { 
            draggable: true,
            icon: redIcon 
        }).addTo(map);

        // Update coordinates on drop
        markerFrom.on('dragend', async function () {
            const pos = markerFrom.getLatLng();
            const lat = pos.lat.toFixed(5);
            const lng = pos.lng.toFixed(5);
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                const address = data.display_name;
                const fromInput = document.getElementById("from-input");
                fromInput.value = address;
                fromCoordinate = [data.lat, data.lon];
                fromInput.dataset.lat = data.lat;
                fromInput.dataset.lon = data.lon;
                markerFrom.bindPopup(address).openPopup();
            } catch (err) {
                console.error("Failed to fetch address name!", err);
            }
        });

        // Pan to marker
        map.panTo(center);
    });

    // Drop To pin button
    document.getElementById('toPin').addEventListener('click', () => {
        if (markerTo) map.removeLayer(markerTo); // Remove old marker if it exists

        // Create draggable marker at center
        const center = map.getCenter();
        markerTo = L.marker(center, { 
            draggable: true,
            icon: greenIcon 
        }).addTo(map);

        // Update coordinates on drop
        markerTo.on('dragend', async function () {
            const pos = markerTo.getLatLng();
            const lat = pos.lat.toFixed(5);
            const lng = pos.lng.toFixed(5);
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                const address = data.display_name;
                const toInput = document.getElementById("to-input");
                toInput.value = address;
                toCoordinate = [data.lat, data.lon];
                toInput.dataset.lat = data.lat;
                toInput.dataset.lon = data.lon;
                markerTo.bindPopup(address).openPopup();
            } catch (err) {
                console.error("Failed to fetch address name!", err);
            }
        });

        // Pan to marker
        map.panTo(center);
    });
}