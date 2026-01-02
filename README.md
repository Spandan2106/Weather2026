# Weather Monitoring Dashboard

A modern, responsive weather dashboard built with Next.js that provides real-time weather data, forecasts, and visualizations.

## Features

- **Real-time Weather**: Get current temperature, humidity, wind speed, visibility, and pressure.
- **Location Detection**: Automatically detects user location to show local weather.
- **City Search**: Search for weather in any city with autocomplete suggestions.
- **5-Day Forecast**: View hourly and daily weather forecasts.
- **Data Visualization**: Interactive temperature trend chart using Recharts.
- **Air Quality Index (AQI)**: Displays current air quality levels.
- **Dark Mode**: Toggle between light and dark themes.
- **Unit Conversion**: Switch between Celsius and Fahrenheit.
- **Responsive Design**: Glassmorphism UI that works on desktop and mobile.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: CSS Modules / Global CSS (Glassmorphism design)
- **Charts**: [Recharts](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **API**: [OpenWeatherMap API](https://openweathermap.org/api)

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- An API key from [OpenWeatherMap](https://openweathermap.org/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/weather-monitoring-dashboard.git
   cd weather-monitoring-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your OpenWeatherMap API key:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to http://localhost:3000 to view the app.