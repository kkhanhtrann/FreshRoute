import { state } from './state.js';

export function initMap() {
    const map = L.map('map', { zoomControl: false }).setView([state.currentLat, state.currentLon], 13); // Salt Lake City as default view

    // fetch('routeData/whole_slc_walks.geojson')
    // .then(response => response.json())
    // .then(data => {
    //     // Add to map
    //     L.geoJSON(data, {
    //         style: {
    //             color: '#DC143C',
    //             weight: 2
    //         }
    //     }).addTo(map);
    // })
    // .catch(err => console.error('Failed to load GeoJSON:', err));

    state.map = map;
    // Initialize the sidebar
    var sidebar = L.control.sidebar({
        container: 'sidebar',
        position: 'left'
    }).addTo(map);

    state.sidebar = sidebar;

    const satelliteLight = L.tileLayer('http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}', {
        attribution: 'Imagery&copy; 2025 Airbus, Landsat / Copernicus, Maxar Technologies, USDA/FPAC/GEO, Map data &copy;2025 Google',
        minZoom: 0,
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const satelliteDark = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution: 'Global Imagery Browse Services (GIBS), NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>), NASA/HQ.',
        minZoom: 0,
        maxZoom: 8,
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level'
    });

    const mapDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    });

    const mapLight = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    });

    mapLight.addTo(map);

    const satHTML = `
                    <div style="position: relative; width: 90px; height: 90px;">
                        <img src="images/satLight-icon.png" style="width: 90px; height: 90px;">
                        <div class = "satText" style="
                        position: absolute;
                        top: 80%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color:white;
                        font-size: 20px;
                        pointer-events: none;
                        text-shadow:
                            -1px -1px 0 #000,
                            1px -1px 0 #000,
                            -1px  1px 0 #000,
                            1px  1px 0 #000;
                        ">
                        Satellite
                        </div>
                    </div>
                    `;

    //Position of + - zoom buttons
    L.control.zoom({ position: 'topleft' }).addTo(map);

    const CombinedControl = L.Control.extend({
        options: { position: 'bottomright' },

        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control combined-control');

            // Day/Night toggle HTML (switch first)
            const dayNightHTML = `
            <div class="switchContainer">
                <input type="checkbox" id="check">
                <label for="check" class="slideButton"></label>
            </div>
            `;

            // Satellite toggle button HTML (satellite button second)
            const satButtonHTML = `<div class="change-map-texture" title="Toggle Satellite">${satHTML}</div>`;

            // Put switch first, then satellite button
            container.innerHTML = dayNightHTML + satButtonHTML;

            container.style.backgroundColor = 'transparent';
            container.style.display = 'flex';
            container.style.gap = '4px';
            container.style.alignItems = 'center';
            container.style.padding = 'none';
            container.style.border = 'none';
            container.style.margin = '2px';

            // Satellite toggle logic
            let isSatellite = false;
            let isNight = false;
            container.querySelector('.change-map-texture').addEventListener('click', () => {
                const buttonTexture = container.querySelector('.change-map-texture img');
                const textDiv = container.querySelector('.change-map-texture .satText');
                if (isSatellite) {
                    if(isNight) {
                        map.removeLayer(satelliteDark);
                        mapDark.addTo(map);
                        buttonTexture.src = 'images/satDark-icon.png';
                    }
                    else {
                        map.removeLayer(satelliteLight);
                        mapLight.addTo(map);
                        buttonTexture.src = 'images/satLight-icon.png';
                    }
                } else {
                    if(isNight) {
                        map.removeLayer(mapDark);
                        satelliteDark.addTo(map);
                        buttonTexture.src = 'images/mapDark-icon.png';
                    }
                    else {
                        map.removeLayer(mapLight);
                        satelliteLight.addTo(map);
                        buttonTexture.src = 'images/mapLight-icon.png';
                    }
                }
                textDiv.textContent = isSatellite ? "Satellite" : "Map";
                isSatellite = !isSatellite;
                addPurpleAir();
            });

            L.DomEvent.disableClickPropagation(container);

            // Day/Night toggle logic
            const checkbox = container.querySelector('#check');
            checkbox.addEventListener('change', (e) => {
                const buttonTexture = container.querySelector('.change-map-texture img');
                if (isNight) {
                    if(isSatellite) {
                        map.removeLayer(satelliteDark);
                        satelliteLight.addTo(map);
                        buttonTexture.src = 'images/mapLight-icon.png';
                    }
                    else {
                        map.removeLayer(mapDark);
                        mapLight.addTo(map);
                        buttonTexture.src = 'images/satLight-icon.png';
                    }
                } else {
                    if(isSatellite) {
                        map.removeLayer(satelliteLight);
                        satelliteDark.addTo(map);
                        buttonTexture.src = 'images/mapDark-icon.png';
                    }
                    else {
                        map.removeLayer(mapLight);
                        mapDark.addTo(map);
                        buttonTexture.src = 'images/satDark-icon.png';
                    }
                }
                isNight = !isNight;
                addPurpleAir();
            });
            
            return container;
        }
    });

    map.addControl(new CombinedControl());
    addPurpleAir();
    return map;
}

function addPurpleAir(){
    // Append your logo inside attribution container
    const attributionContainer = state.map.attributionControl._container;

    const logoHTML = `
    <a href="https://map.purpleair.com/air-quality-standards-us-epa-aqi?opt=%2F1%2Flp%2Fa10%2Fp604800%2FcC0#1/19.5/-30" target="_blank" style="display:inline-block; vertical-align:middle; margin-right:1px;">
        <img src="images/purpleAirLong.png" alt="Logo" style="height:14px; width:auto; vertical-align:middle;">
    </a>
    `;

    attributionContainer.innerHTML = logoHTML + attributionContainer.innerHTML;
}