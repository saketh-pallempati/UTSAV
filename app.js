const express = require("express");
const fs = require("fs");
const app = express();
const port = 8080;
app.use(express.json());

const satellitesFile = './satellites.json';
const stationsFile = './stations.json';

function readDataFromFile(file) {
    if (fs.existsSync(file)) {
        const data = fs.readFileSync(file);
        return JSON.parse(data);
    }
    return [];
}

function writeDataToFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data));
}

function nextPos(satellite) {
    const prevLatitude = satellite.latitude;
    const prevLongitude = satellite.longitude;
    const prevAltitude = satellite.altitude_km;
    const denominator = Math.sqrt(
        prevLatitude ** 2 + prevLongitude ** 2 + prevAltitude ** 2
    );
    const nextLatitude = prevLatitude / denominator;
    const nextLongitude = prevLongitude / denominator;
    const nextaltitude = prevAltitude / denominator;
    satellite.latitude = Math.round((prevLatitude + nextLatitude) * 1000) / 1000;
    satellite.longitude = Math.round((prevLongitude + nextLongitude) * 1000) / 1000;
    satellite.altitude_km = Math.round((prevAltitude + nextaltitude) * 1000) / 1000;
}

app.post("/app/task/mindist", (req, res) => {
    const { id1, id2 } = req.body;
    const satellites = readDataFromFile(satellitesFile);
    const satellite1 = satellites.find((satellite) => satellite.id === id1);
    const satellite2 = satellites.find((satellite) => satellite.id === id2);
    let minDistance = Infinity;
    let distance = 0;
    for (i = 0; i < 30; i++) {
        distance = Math.sqrt(
            (satellite1.latitude - satellite2.latitude) ** 2 +
            (satellite1.longitude - satellite2.longitude) ** 2 +
            (satellite1.altitude_km - satellite2.altitude_km) ** 2
        );
        distance = Math.round(distance * 1000) / 1000;
        minDistance = Math.min(minDistance, distance);
        nextPos(satellite1);
        nextPos(satellite2);
    }
    res.json({ min_distance: minDistance, success: true });
});

app.post("/app/task/nearestgs", (req, res) => {
    const id = req.body.id;
    const satellites = readDataFromFile(satellitesFile);
    const stations = readDataFromFile(stationsFile);
    const satellite = satellites.find((satellite) => satellite.id === id);
    let station_id = 0;
    let minDistance = Infinity;
    for (const station of stations) {
        const distance = Math.sqrt(
            (satellite.latitude - station.latitude) ** 2 +
            (satellite.longitude - station.longitude) ** 2 +
            satellite.altitude_km ** 2
        );
        if (distance < minDistance) {
            minDistance = distance;
            station_id = station.id;
        }
    }

    const station = stations.find((station) => station.id === station_id);
    const stationObj = {
        name: station.name,
        id: station_id,
        distance: Math.round(minDistance * 1000) / 1000,
    };
    res.json({ ground_station: stationObj, success: true });
});

app.post("/app/task/nextpos", (req, res) => {
    const id = req.body.id;
    const satellites = readDataFromFile(satellitesFile);
    const satellite = satellites.find((satellite) => satellite.id === id);
    nextPos(satellite);
    res.json({ satellite: satellite, success: true });
});

app.delete("/app/delete/satellites", (req, res) => {
    const ids = req.body.id;
    let satellites = readDataFromFile(satellitesFile);
    satellites = satellites.filter((satellite) => !ids.includes(satellite.id));
    writeDataToFile(satellitesFile, satellites);
    res.json({ satellites: satellites, success: true });
});

app.delete("/app/delete/groundst", (req, res) => {
    const ids = req.body.id;
    let stations = readDataFromFile(stationsFile);
    stations = stations.filter((station) => !ids.includes(station.id));
    writeDataToFile(stationsFile, stations);
    res.json({ ground_stations: stations, success: true });
});

app.put("/app/update/groundst", (req, res) => {
    if (!req.body || !req.body.ground_stations) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid request body" });
    }
    const newStations = req.body.ground_stations;
    let stations = readDataFromFile(stationsFile);
    stations = stations.concat(newStations);
    writeDataToFile(stationsFile, stations);
    res.json({ ground_stations: stations, success: true });
});

app.put("/app/update/satellites", (req, res) => {
    if (!req.body || !req.body.satellites) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid request body" });
    }
    const newSatellites = req.body.satellites;
    let satellites = readDataFromFile(satellitesFile);
    satellites = satellites.concat(newSatellites);
    writeDataToFile(satellitesFile, satellites);
    res.json({ satellites: satellites, success: true });
});

app.get("/app/get/groundst", (req, res) => {
    const stations = readDataFromFile(stationsFile);
    res.json({ ground_stations: stations, success: true });
});

app.post("/app/create/groundst", (req, res) => {
    if (!req.body || !req.body.ground_stations) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid request body" });
    }
    const stations = req.body.ground_stations;
    writeDataToFile(stationsFile, stations);
    res.json({ success: true });
});
app.get("/app/get/satellites", (req, res) => {
    const satellites = readDataFromFile(satellitesFile);
    res.json({ satellites: satellites, success: true });
});
app.post("/app/create/satellites", (req, res) => {
    if (!req.body || !req.body.satellites) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid request body" });
    }
    const satellites = req.body.satellites;
    writeDataToFile(satellitesFile, satellites);
    res.json({ success: true });
});

app.get("/app", (req, res) => {
    res.json({ "message": "Hello World!" });
});

app.get("/", (req, res) => {
    res.send("Home route!");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
