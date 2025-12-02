export interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        isDay: boolean;
        windSpeed: number;
        humidity: number;
        time: string;
        aqi: number; // Added AQI
    };
    daily: {
        time: string[];
        weatherCode: number[];
        temperatureMax: number[];
        temperatureMin: number[];
        sunrise: string[];
        sunset: string[];
        uvIndexMax: number[];
    };
    hourly: {
        time: string[];
        temperature: number[];
        weatherCode: number[];
    };
}

export async function getWeather(): Promise<WeatherData | null> {
    try {
        const [weatherRes, aqiRes] = await Promise.all([
            fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=9.9312&longitude=76.2673&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto',
                { next: { revalidate: 3600 } }
            ),
            fetch(
                'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=9.9312&longitude=76.2673&current=us_aqi',
                { next: { revalidate: 3600 } }
            )
        ]);

        if (!weatherRes.ok || !aqiRes.ok) throw new Error('Failed to fetch weather or AQI data');

        const weatherData = await weatherRes.json();
        const aqiData = await aqiRes.json();

        return {
            current: {
                temperature: weatherData.current.temperature_2m,
                weatherCode: weatherData.current.weather_code,
                isDay: !!weatherData.current.is_day,
                windSpeed: weatherData.current.wind_speed_10m,
                humidity: weatherData.current.relative_humidity_2m,
                time: weatherData.current.time,
                aqi: aqiData.current.us_aqi,
            },
            daily: {
                time: weatherData.daily.time,
                weatherCode: weatherData.daily.weather_code,
                temperatureMax: weatherData.daily.temperature_2m_max,
                temperatureMin: weatherData.daily.temperature_2m_min,
                sunrise: weatherData.daily.sunrise,
                sunset: weatherData.daily.sunset,
                uvIndexMax: weatherData.daily.uv_index_max,
            },
            hourly: {
                time: weatherData.hourly.time,
                temperature: weatherData.hourly.temperature_2m,
                weatherCode: weatherData.hourly.weather_code,
            }
        };
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

export function getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };
    return codes[code] || 'Unknown';
}

export function getWeatherIcon(code: number, isDay: boolean = true): string {
    // Simple mapping, can be expanded
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code >= 1 && code <= 3) return isDay ? '⛅' : '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌡️';
}
