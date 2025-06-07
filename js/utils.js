// Do not ask me how I know this, I pulled this from StackOverflow
// But basically what Haversine does is it takes two points on a sphere and calculates the distance between them
export function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }

    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const { sin, cos, sqrt, atan2 } = Math;

    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
        + cos(lat1) * cos(lat2)
        * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;
    return d; // distance in km
}

export function getClosestWeather(lat, lon, weatherData) {
    let closestNode = null;
    let minDistance = Infinity;

    for (const key in weatherData) {
        const [nodeLat, nodeLon] = key.split(',').map(Number);
        const distance = haversineDistanceKM(lat, lon, nodeLat, nodeLon);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = key;
        }
    }

    return closestNode;
}

// I GPT-ed this class
/**
 * Used in dijkstra's
 */
export class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift(); // Always removes the one with lowest priority
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// =============================================================== //
// ========================== CSV Utils ========================== // 
// =============================================================== //
export function downloadAsCSV(data, filename = "weather_data.csv") {
    const headers = [
        // "timestamp",
        "sensor_index",  // added
        "humidity",
        "temperature",
        "pm2_5",
        "latitude",
        "longitude",
        "date_time"
    ];

    const csvRows = [headers.join(",")];

    for (const row of data) {
        const values = headers.map(h => row[h] ?? "");
        csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    console.log("Downloading weather data as CSV:", filename);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export async function checkCSVExists(dateString) {
    const url = `../weatherData/${dateString}.csv`;

    try {
        const res = await fetch(url, { method: 'HEAD' });

        if (!res.ok) {
            console.error(`File not found: ${url} (status: ${res.status})`);
            return false;
        }

        return true;
    } catch (err) {
        console.error(`Fetch failed for ${url}`, err);
        return false;
    }
}

export async function loadCSV(dateString) {
    const url = `../weatherData/${dateString}.csv`;
    const res = await fetch(url);
    const text = await res.text();
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',');

    return lines.map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((h, i) => {
            row[h] = values[i];
        });
        return row;
    });
}

export function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const entry = {};

        headers.forEach((key, i) => {
            let val = values[i];

            if (val === undefined || val === '') {
                entry[key] = null;
            } else if (['latitude', 'longitude'].includes(key)) {
                entry[key] = parseFloat(val);
            } else if (!isNaN(val) && val !== '') {
                entry[key] = Number(val);
            } else {
                entry[key] = val;
            }
        });

        return entry;
    });
}

// =============================================================== //
// ======================== End CSV Utils ======================== // 
// =============================================================== //


export async function loadSensors() {
    const res = await fetch('/sensors/boundingbox_sensors.csv');
    const text = await res.text();
    return parseCSV(text); // returns array of { sensor_index, name, latitude, longitude }
}

export function findClosestSensor(lat, lon, sensors) {
    let closestSensor = sensors[0];
    let minDistance = haversineDistanceKM(lat, lon, closestSensor.latitude, closestSensor.longitude);

    for (let i = 1; i < sensors.length; i++) {
        const sensor = sensors[i];
        const dist = haversineDistanceKM(lat, lon, sensor.latitude, sensor.longitude);
        if (dist < minDistance) {
            minDistance = dist;
            closestSensor = sensor;
        }
    }

    return closestSensor.sensor_index;
}