const axios = require('axios');

module.exports = function(app) {
    async function getCoordinates(city) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`;
        const response = await axios.get(url, { headers: { 'User-Agent': 'Node.js' } });
        const data = response.data;
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        throw new Error(`City not found: ${city}`);
    }

    function haversineDistance(lat1, lon1, lat2, lon2, unit = 'km') {
        const R = unit === 'km' ? 6371 : 3958.8;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async function getDrivingDistance(startLat, startLon, endLat, endLon, unit = 'km') {
        const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
        const response = await axios.get(url);
        const data = response.data;
        if (data.routes && data.routes.length > 0) {
            return unit === 'km' ? data.routes[0].distance / 1000 : data.routes[0].distance / 1609.34;
        }
        return null;
    }

    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        return `${hours}j ${mins}m ${secs}d`;
    }

    function estimateTravelTimes(crowFlies, drivingDistance, unit = 'km') {
        const motorcycleSpeed = unit === 'km' ? 40 : 24.85;
        const carSpeed = unit === 'km' ? 80 : 49.71;
        const busSpeed = unit === 'km' ? 50 : 31.07;
        const trainSpeed = unit === 'km' ? 100 : 62.14;
        const planeSpeed = unit === 'km' ? 800 : 497.10;
        
        const motorcycleTime = drivingDistance ? (drivingDistance / motorcycleSpeed) * 60 : 'N/A';
        const carTime = drivingDistance ? (drivingDistance / carSpeed) * 60 : 'N/A';
        const busTime = drivingDistance ? (drivingDistance / busSpeed) * 60 : 'N/A';
        const trainTime = drivingDistance ? (drivingDistance / trainSpeed) * 60 : 'N/A';
        const planeTime = (crowFlies / planeSpeed) * 60;
        
        return {
            motorcycle: motorcycleTime !== 'N/A' ? formatTime(motorcycleTime) : 'N/A',
            car: carTime !== 'N/A' ? formatTime(carTime) : 'N/A',
            bus: busTime !== 'N/A' ? formatTime(busTime) : 'N/A',
            train: trainTime !== 'N/A' ? formatTime(trainTime) : 'N/A',
            plane: formatTime(planeTime)
        };
    }

    async function calculateDistance(cityA, cityB, unit = 'km') {
        try {
            const coordsA = await getCoordinates(cityA);
            const coordsB = await getCoordinates(cityB);
            const crowFlies = haversineDistance(coordsA.lat, coordsA.lon, coordsB.lat, coordsB.lon, unit);
            const drivingDistance = await getDrivingDistance(coordsA.lat, coordsA.lon, coordsB.lat, coordsB.lon, unit);
            const times = estimateTravelTimes(crowFlies, drivingDistance, unit);
            
            return {
                route: `${cityA} to ${cityB}`,
                straightDistance: `${crowFlies.toFixed(2)} ${unit}`,
                drivingDistance: drivingDistance ? `${drivingDistance.toFixed(2)} ${unit}` : 'N/A',
                travelTimes: times
            };
        } catch (error) {
            console.error('Error calculating distance:', error.message);
            return null;
        }
    }

    app.get('/tools/jarak', async (req, res) => {
        try {
            const { city1, city2, unit = 'km' } = req.query;
            if (!city1 || !city2) {
                return res.status(400).json({ status: false, error: 'City parameters are required' });
            }

            const result = await calculateDistance(city1, city2, unit);
            if (!result) {
                return res.status(500).json({ status: false, error: 'Failed to calculate distance' });
            }
            
            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
