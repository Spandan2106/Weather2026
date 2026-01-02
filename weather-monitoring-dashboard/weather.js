import axios from 'axios';

export default async function handler(req, res) {
    const { endpoint, ...params } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server API key not configured' });
    }

    let baseUrl = '';
    // Map internal endpoints to OpenWeatherMap URLs
    switch (endpoint) {
        case 'weather':
            baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
            break;
        case 'forecast':
            baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';
            break;
        case 'air_pollution':
            baseUrl = 'https://api.openweathermap.org/data/2.5/air_pollution';
            break;
        case 'geo':
            baseUrl = 'https://api.openweathermap.org/geo/1.0/direct';
            break;
        default:
            return res.status(400).json({ error: 'Invalid endpoint' });
    }

    try {
        // Make the actual request to OpenWeatherMap with the key
        const response = await axios.get(baseUrl, {
            params: {
                ...params,
                appid: apiKey
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error fetching data' });
    }
}