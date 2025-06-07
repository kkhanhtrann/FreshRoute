# Fresh Route

A web-based application that helps users find **walking routes in Salt Lake City** based on **air quality**, **temperature**, and **humidity** conditions, prioritizing environmental comfort and health over pure distance or speed.

---

## Project Goal

The primary goal is to offer an alternative to standard route-finding tools by factoring in **real-time and forecasted weather data** to suggest cleaner, safer walking paths. This is especially relevant in urban environments affected by **pollution**, **heat islands**, or **wildfire smoke**.

---

## Why We Created This

As someone living in a city affected by fluctuating air quality and extreme weather, we noticed that traditional route-finding apps do not consider **environmental wellness**. We wanted a tool that would:

- Avoid polluted areas
- Optimize for better walking conditions
- Educate users on the importance of air and weather awareness
- Provide a meaningful reason to **walk smarter**, not just faster

---

## Features

- **Search interface** with autocomplete for start and end points
- Visual routing on a Leaflet map
- Integration of weather data (temperature, humidity) per road segment
- PM2.5 air quality scoring per edge
- Selection of forecast day (up to 7 days in advance)
- Hour-by-hour time slot selector
- Real-time tracking or static route planning
- Optimized with **Web Workers** for fast processing of large edge networks (~200,000 edges)

---

## APIs & Libraries Used

### Mapping and Routing

- [Leaflet.js](https://leafletjs.com/) – Interactive maps
- [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder) – Address searching
- [Nominatim Search API](https://nominatim.org/release-docs/develop/api/Search/) 
– Geocoding queries (bias set to Salt Lake City)
- [OpenStreetMap](https://www.openstreetmap.org/) – Base maps and location data

### Map Tile Providers

- **Google Maps Satellite Tiles**  
  Imagery © 2025 Airbus, Landsat / Copernicus, Maxar Technologies, USDA/FPAC/GEO, Map data © 2025 Google  
  `http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}`

- **NASA VIIRS City Lights**  
  Global Imagery Browse Services (GIBS), NASA/GSFC/Earth Science Data and Information System ([ESDIS](https://earthdata.nasa.gov)), NASA/HQ  
  `https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/...`

- **Stadia Maps (Dark)**  
  © [Stadia Maps](https://www.stadiamaps.com/), [OpenMapTiles](https://openmaptiles.org/), [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors  
  `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png`

- **Stadia Maps + Stamen Terrain (Light)**  
  © [Stadia Maps](https://www.stadiamaps.com/), [Stamen Design](https://www.stamen.com/), [OpenMapTiles](https://openmaptiles.org/), [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors  
  `https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png`

### Environmental & Weather Data

- [Open-Meteo API](https://open-meteo.com/) – Hourly weather forecasts (temperature, humidity)
- [PurpleAir API](https://api.purpleair.com/) – PM2.5 air quality sensor data

---

### Authors & Contributions

- **Khanh Tran** – Project lead, main developer. Implemented weather and air quality integration, routing logic, UI functionality, performance optimization, and overall system architecture.
- **Gabriel Min** – Contributed to early concept discussions, designed map styling, wrote documentation, and supported implementation of logic components.
- **Kai Markley** – Provided helpful UI and feature suggestions during development.


---

## Credits

Special thanks to:

- **Leaflet.js** and its plugin ecosystem
- **Open-Meteo** for their free, fast forecast API
- **PurpleAir** for their contribution to open environmental data
- **OpenStreetMap and Nominatim** for open and flexible geolocation APIs

---

## License

This project is open-source and available under the [MIT License](LICENSE).