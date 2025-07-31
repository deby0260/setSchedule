# OpenWeather API Setup Instructions

## Getting Your API Key

1. **Sign up for OpenWeather API**:
   - Go to [https://openweathermap.org/api](https://openweathermap.org/api)
   - Click "Sign Up" and create a free account
   - Verify your email address

2. **Get Your API Key**:
   - Log in to your OpenWeather account
   - Go to "My API Keys" section
   - Copy your default API key (or create a new one)

3. **Add API Key to Your App**:
   - Open `src/app/services/weather.service.ts`
   - Replace `'YOUR_OPENWEATHER_API_KEY'` with your actual API key:
   
   ```typescript
   private readonly API_KEY = 'your_actual_api_key_here';
   ```

## Features Implemented

### Current Weather Display
- **Real-time Weather**: Shows current temperature, conditions, and location
- **Smart Recommendations**: Provides child-specific weather advice
- **Dynamic Icons**: Weather-appropriate Ionic icons
- **Color-coded Alerts**: Different colors for different weather conditions

### Weather Data Includes:
- Temperature in Celsius
- Weather description (sunny, cloudy, rainy, etc.)
- Humidity and wind speed
- City and country location
- Personalized recommendations for children

### Fallback System:
- If geolocation fails, defaults to Manila weather
- If API fails, shows fallback weather data
- Graceful error handling with user-friendly messages

## Weather Recommendations

The app provides smart recommendations based on weather conditions:

- **Sunny**: "Remember to bring a hat for your child"
- **Hot (>30°C)**: "Bring a hat and water for your child"
- **Rainy**: "Don't forget an umbrella and raincoat"
- **Thunderstorm**: "Keep your child indoors if possible"
- **Cold**: "Dress your child warmly"

## Usage

Once set up, the weather will automatically:
1. Request location permission
2. Fetch current weather for your location
3. Display weather info with recommendations
4. Allow manual refresh with the refresh button

## Free Tier Limits

OpenWeather free tier includes:
- 1,000 API calls per day
- Current weather data
- 5-day forecast (if needed later)

This is more than enough for a personal app that checks weather a few times per day.
