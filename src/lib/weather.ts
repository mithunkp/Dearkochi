export interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        isDay: boolean;
        windSpeed: number;
        humidity: number;
        time: string;
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
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=9.9312&longitude=76.2673&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto',
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!res.ok) throw new Error('Failed to fetch weather data');

        const data = await res.json();

        return {
            current: {
                temperature: data.current.temperature_2m,
                weatherCode: data.current.weather_code,
                isDay: !!data.current.is_day,
                windSpeed: data.current.wind_speed_10m,
                humidity: data.current.relative_humidity_2m,
                time: data.current.time,
            },
            daily: {
                time: data.daily.time,
                weatherCode: data.daily.weather_code,
                temperatureMax: data.daily.temperature_2m_max,
                temperatureMin: data.daily.temperature_2m_min,
                sunrise: data.daily.sunrise,
                sunset: data.daily.sunset,
                uvIndexMax: data.daily.uv_index_max,
            },
            hourly: {
                time: data.hourly.time,
                temperature: data.hourly.temperature_2m,
                weatherCode: data.hourly.weather_code,
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
