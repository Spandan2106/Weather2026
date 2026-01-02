//pages/index.js
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Weather = () => {
    const router = useRouter();
    const [city, setCity] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [hourlyForecast, setHourlyForecast] = useState([]);
    const [dailyForecast, setDailyForecast] = useState([]);
    const [rawForecast, setRawForecast] = useState(null);
    const [coord, setCoord] = useState(null);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState([]);
    const [unit, setUnit] = useState('C');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [aqi, setAqi] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const debounceTimeout = useRef(null);

    const fetchAndSetWeather = async (url) => {
        setLoading(true);
        try {
            setError('');
            const response = await axios.get(url);
            const data = response.data;
            console.log(data);
            setWeatherData(data);
            setCoord(data.coord);

            // Fetch forecast data
            const urlcast = `/api/weather?endpoint=forecast&lat=${data.coord.lat}&lon=${data.coord.lon}`;
            const forecastResponse = await axios.get(urlcast);
            const forecast = forecastResponse.data;
            setRawForecast(forecast);

            // Process and set hourly forecast
            setHourlyForecast(forecast.list.slice(0, 5));

            // Process and set daily forecast (every 8th item is the next day)
            setDailyForecast(forecast.list.filter((_, index) => index % 8 === 0).slice(0, 5));

            // Fetch AQI data
            const aqiUrl = `/api/weather?endpoint=air_pollution&lat=${data.coord.lat}&lon=${data.coord.lon}`;
            const aqiResponse = await axios.get(aqiUrl);
            if (aqiResponse.data && aqiResponse.data.list && aqiResponse.data.list.length > 0) {
                setAqi(aqiResponse.data.list[0].main.aqi);
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            if (error.response && error.response.status === 404) {
                setError('City not found. Please check the spelling.');
            } else {
                setError('An error occurred while fetching data.');
            }
            setWeatherData(null);
            setHourlyForecast([]);
            setDailyForecast([]);
            setChartData([]);
            setAqi(null);
        } finally {
            setLoading(false);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const url = `/api/weather?endpoint=weather&lat=${latitude}&lon=${longitude}`;
            fetchAndSetWeather(url);
        }, (error) => {
            console.error("Geolocation error:", error);
            let msg = "Geolocation permission denied. Showing weather for a default city.";
            if (error.code === 2) msg = "Location unavailable.";
            if (error.code === 3) msg = "Location request timed out.";
            
            setError(msg);
            const defaultUrl = `/api/weather?endpoint=weather&q=London`;
            fetchAndSetWeather(defaultUrl);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    };

    useEffect(() => {
        handleUseMyLocation();
    }, []);

    const searchByCity = async () => {
        if (!city) return;
        const urlsearch = `/api/weather?endpoint=weather&q=${city}`;
        fetchAndSetWeather(urlsearch);
        setCity('');
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCity(value);
        
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            if (value.length > 2) {
                try {
                    const url = `/api/weather?endpoint=geo&q=${encodeURIComponent(value)}&limit=5`;
                    const res = await axios.get(url);
                    setSuggestions(res.data);
                } catch (error) {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);
    };

    const handleSelectSuggestion = (suggestion) => {
        setCity(`${suggestion.name}, ${suggestion.country}`);
        setSuggestions([]);
        const url = `/api/weather?endpoint=weather&lat=${suggestion.lat}&lon=${suggestion.lon}`;
        fetchAndSetWeather(url);
    };

    const convertTemperature = (kelvin) => {
        if (unit === 'F') {
            return Math.floor((kelvin - 273.15) * 9 / 5 + 32);
        }
        return Math.floor(kelvin - 273.15);
    };

    const getAqiLabel = (aqiValue) => {
        switch (aqiValue) {
            case 1: return "Good";
            case 2: return "Fair";
            case 3: return "Moderate";
            case 4: return "Poor";
            case 5: return "Very Poor";
            default: return "Unknown";
        }
    };

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    useEffect(() => {
        if (rawForecast) {
            const formattedData = rawForecast.list.map(item => ({
                time: new Date(item.dt * 1000).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', hour12: true }),
                temp: convertTemperature(item.main.temp)
            }));
            setChartData(formattedData);
        }
    }, [unit, rawForecast]);

    return (
        <div>
            <div className="header">
                <h1>WEATHER Monitoring Dashboard</h1>
                <div className="header-controls">
                    <button id="location-btn" onClick={handleUseMyLocation} disabled={loading}>
                        {loading ? 'Locating...' : 'Use My Location'}
                    </button>
                    <div className="search-container">
                        <input
                            type="text"
                            name=""
                            id="input"
                            placeholder="Enter city name"
                            value={city}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && searchByCity()}
                        />
                        {suggestions.length > 0 && (
                            <ul className="suggestions-list">
                                {suggestions.map((s, i) => (
                                    <li key={i} onClick={() => handleSelectSuggestion(s)}>
                                        {s.name}, {(s.state && s.state !== s.name) ? `${s.state}, ` : ''}{s.country}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button id="search" onClick={searchByCity}>
                        Search
                    </button>
                    <div className="switch-container">
                        <span>°C</span>
                        <label className="switch">
                            <input type="checkbox" onChange={() => setUnit(unit === 'C' ? 'F' : 'C')} />
                            <span className="slider round"></span>
                        </label>
                        <span>°F</span>
                    </div>
                    <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle Dark Mode">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            {weatherData && <main>
                <div className="weather">
                    <h2 id="city">{weatherData.name}, {weatherData.sys.country}</h2>
                    <div className="temp-box">
                        {weatherData.weather[0].icon && (
                            <img
                                id="img"
                                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                                alt={weatherData.weather[0].description}
                            />
                        )}
                        <p id="temperature">
                            {convertTemperature(weatherData.main.temp)}°{unit}
                        </p>
                    </div>
                    <span id="clouds">{weatherData.weather[0].description}</span>

                    <div className="weather-details">
                        <div className="detail-box">
                            <p className="detail-label">Humidity</p>
                            <p className="detail-value">{weatherData.main.humidity}%</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Wind Speed</p>
                            <p className="detail-value">{weatherData.wind.speed} m/s</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Sunrise</p>
                            <p className="detail-value">{new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Sunset</p>
                            <p className="detail-value">{new Date(weatherData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Feels Like</p>
                            <p className="detail-value">{convertTemperature(weatherData.main.feels_like)}°{unit}</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Visibility</p>
                            <p className="detail-value">{(weatherData.visibility / 1000).toFixed(1)} km</p>
                        </div>
                        <div className="detail-box">
                            <p className="detail-label">Pressure</p>
                            <p className="detail-value">{weatherData.main.pressure} hPa</p>
                        </div>
                        {aqi && (
                            <div className="detail-box">
                                <p className="detail-label">Air Quality</p>
                                <p className="detail-value">{getAqiLabel(aqi)}</p>
                            </div>
                        )}
                        {rawForecast && rawForecast.list && rawForecast.list.length > 0 && (
                            <div className="detail-box">
                                <p className="detail-label">Rain Chance</p>
                                <p className="detail-value">{Math.round(rawForecast.list[0].pop * 100)}%</p>
                            </div>
                        )}
                    </div>
                    
                    {coord && (
                        <div className="map-container">
                            <iframe
                                title="Google Map"
                                src={`https://maps.google.com/maps?q=${coord.lat},${coord.lon}&z=14&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: '15px' }}
                                allowFullScreen=""
                                loading="lazy"
                            ></iframe>
                        </div>
                    )}
                </div>

                <div className="divider"></div>

                <div className="forecast">
                    <p className="cast-header">Upcoming forecast</p>
                    <div className="templist">
                        {hourlyForecast.map((item, index) => (
                            <div className="next" key={index}>
                                <div>
                                    <p className="time">
                                        {new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p>
                                        {convertTemperature(item.main.temp_max)}° / {convertTemperature(item.main.temp_min)}°
                                    </p>
                                </div>
                                <p className="desc">{item.weather[0].description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>}

            {chartData.length > 0 && (
                <div className="chart-container">
                    <h3 className="cast-header">Temperature Trend (5 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="time" stroke="#fff" tick={{ fontSize: 12 }} interval={4} />
                                <YAxis stroke="#fff" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px', color: '#fff' }} />
                                <Legend />
                                <Line type="monotone" dataKey="temp" stroke="#ffd166" activeDot={{ r: 8 }} strokeWidth={2} name={`Temperature (°${unit})`} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="divider-2"></div>
            
            {dailyForecast.length > 0 && <div className="forecast-2">
                <p className="cast-header"> Next 5 days forecast</p>
                <div className="weekF">
                    {dailyForecast.map((item, index) => (
                        <div className="dayF" key={index}>
                            <p className="date">{new Date(item.dt * 1000).toDateString()}</p>
                            <p>{convertTemperature(item.main.temp_max)}° / {convertTemperature(item.main.temp_min)}°</p>
                            <p className="desc">{item.weather[0].description}</p>
                        </div>
                    ))}
                </div>
            </div>}
        </div>
    );
};

export default Weather;