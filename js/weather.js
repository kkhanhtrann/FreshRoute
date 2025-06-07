import { state } from './state.js';
import { findClosestSensor, downloadAsCSV, loadCSV, checkCSVExists } from './utils.js';

export async function refreshWeatherData(dayInAdvance = 0, targetHour = 14) {
    document.getElementById("loader-wrapper").style.display = "block";

    if (state.currentDayInAdvance !== dayInAdvance || state.currentHourIndex !== targetHour || !state.graph) {
        console.log("Refreshing weather data...");
        state.cachedWeatherGrid = await fetchWeatherGrid(dayInAdvance, targetHour);
    } else {
        console.log("Using cached weather data.");
        document.getElementById("loader-wrapper").style.display = "none";
        return;
    }

    const weatherGrid = state.cachedWeatherGrid;

    // Using Web Workers to assign weather data to edges (it's concurrent)
    return new Promise((resolve, reject) => {
        const total = state.edges.length;
        const chunkSize = Math.ceil(total / 3); // Divide edges into 3 chunks for 3 workers
        const results = [];
        let completed = 0;

        // Launch 3 web workers for concurrent processing
        for (let i = 0; i < 3; i++) {
            const worker = new Worker('./js/worker.js', { type: 'module' });
            const startIndex = i * chunkSize;
            const chunk = state.edges.slice(startIndex, startIndex + chunkSize);

            // Send each worker its chunk of edges and the weather grid
            worker.postMessage({
                edges: chunk,
                weatherData: weatherGrid
            });

            // Handle worker response
            worker.onmessage = (e) => {
                results[i] = e.data; // Store result in correct order
                worker.terminate();
                completed++;

                // When all workers are done, merge results and update state
                if (completed === 3) {
                    state.edges = results.flat();
                    console.log("Weather data assigned");
                    document.getElementById("loader-wrapper").style.display = "none";
                    resolve();
                }
            };

            // Handle worker errors
            worker.onerror = (err) => {
                console.error("Worker error:", err.message || err);
                worker.terminate();
                document.getElementById("loader-wrapper").style.display = "none";
                reject(err);
            };
        }
    });
}

// NOTE: USE THIS DURING DEVELOPMENT
// /**
//  * Fetches temperature and humidity data from Open-Meteo for a grid over Salt Lake City.
//  * defaults to fetching data for the next day at 2 PM.
//  * Returns a map keyed by "lat,lon" string with weather data.
//  */
async function fetchWeatherGrid(dayInAdvance = 0, targetHour = 14) {
    const weatherData = {};

    // Update state for current day in advance and hour index
    state.currentDayInAdvance = dayInAdvance;
    state.currentHourIndex = targetHour;

    // Format date string as YYYY-MM-DD
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayInAdvance);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    //console.log("Fetching weather data for:", dateString);

    let rows;
    const exists = await checkCSVExists(dateString);

    if (exists) {
        rows = await loadCSV(dateString);
    } else {
        rows = await fetchWeatherGridFullDay(dateString);

        // Download CSV version of it
        downloadAsCSV(rows, `${dateString}.csv`);
    }

    // This part next is to call the air quality API and write the data to the rows
    // ....
    // End of the CSV download part
    for (const row of rows) {
        const date = new Date(row.date_time);
        //const date = new Date(row["date_time\r"]);

        if (date.getHours() === targetHour) {
            const key = `${parseFloat(row.latitude).toFixed(4)},${parseFloat(row.longitude).toFixed(4)}`;
            weatherData[key] = {
                temp: parseFloat(row.temperature),
                humidity: parseFloat(row.humidity),
                pm2_5: parseFloat(row.pm2_5) || 0 
            };
        }
    }

    return weatherData;
}

export async function fetchWeatherGridFullDay(startDate = '2024-06-01',) {
    const latStart = 40.68, latEnd = 40.83, latStep = 0.01;
    const lonStart = -112.05, lonEnd = -111.80, lonStep = 0.01;

    const rows = [];

    for (let lat = latStart; lat <= latEnd; lat += latStep) {
        for (let lon = lonStart; lon <= lonEnd; lon += lonStep) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=temperature_2m,relative_humidity_2m&start_date=${startDate}&end_date=${startDate}&timezone=auto`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                const temps = data.hourly?.temperature_2m;
                const humidities = data.hourly?.relative_humidity_2m;
                const times = data.hourly?.time;

                if (temps && humidities && times && temps.length === humidities.length) {
                    const sensor_index = findClosestSensor(lat, lon, state.sensors);

                    for (let i = 0; i < temps.length; i++) {
                        rows.push({
                            // timestamp: new Date(times[i]).getTime(),
                            humidity: humidities[i],
                            temperature: temps[i],
                            pm2_5: "", // placeholder
                            latitude: parseFloat(lat.toFixed(4)),
                            longitude: parseFloat(lon.toFixed(4)),
                            sensor_index: sensor_index,
                            date_time: times[i]
                        });
                    }
                }
            } catch (err) {
                console.error(`Failed at ${lat}, ${lon}:`, err);
            }

            await new Promise(r => setTimeout(r, 100));
        }
    }

    return rows;
}
