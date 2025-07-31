import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  recommendation: string;
  ionicIcon: string;
  alertColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
  
  private weatherSubject = new BehaviorSubject<WeatherData | null>(null);
  public weather$ = this.weatherSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get weather by city name
  getWeatherByCity(city: string): Observable<WeatherData | null> {
    const url = `${this.BASE_URL}?q=${city}&appid=${this.API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformWeatherData(response)),
      catchError(error => {
        console.error('Error fetching weather:', error);
        return of(this.getFallbackWeather());
      })
    );
  }

  // Get weather by coordinates
  getWeatherByCoordinates(lat: number, lon: number): Observable<WeatherData | null> {
    const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformWeatherData(response)),
      catchError(error => {
        console.error('Error fetching weather:', error);
        return of(this.getFallbackWeather());
      })
    );
  }

  // Get current location weather
  getCurrentLocationWeather(): Observable<WeatherData | null> {
    return new Observable(observer => {
      if (navigator.geolocation) {
        // Configure geolocation options for better accuracy
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log(`Location detected: ${lat}, ${lon}`);

            this.getWeatherByCoordinates(lat, lon).subscribe(
              weather => {
                this.weatherSubject.next(weather);
                observer.next(weather);
                observer.complete();
              }
            );
          },
          error => {
            console.error('Geolocation error:', error);
            console.log('Falling back to Cebu Talisay City');

            // Fallback to Cebu Talisay City (user's location)
            this.getWeatherByCity('Talisay,Cebu,PH').subscribe(
              weather => {
                this.weatherSubject.next(weather);
                observer.next(weather);
                observer.complete();
              }
            );
          },
          options
        );
      } else {
        console.log('Geolocation not supported, using Cebu Talisay City');
        // Geolocation not supported, use Cebu Talisay City
        this.getWeatherByCity('Talisay,Cebu,PH').subscribe(
          weather => {
            this.weatherSubject.next(weather);
            observer.next(weather);
            observer.complete();
          }
        );
      }
    });
  }

  // Get weather specifically for Cebu Talisay City
  getTalisayWeather(): Observable<WeatherData | null> {
    // Using coordinates for more accurate results
    // Talisay City, Cebu coordinates: 10.2449° N, 123.8492° E
    return this.getWeatherByCoordinates(10.2449, 123.8492);
  }

  // Transform API response to our interface
  private transformWeatherData(response: any): WeatherData {
    const weather = response.weather[0];
    const main = response.main;
    const wind = response.wind;
    
    const weatherData: WeatherData = {
      temperature: Math.round(main.temp),
      description: weather.description,
      icon: weather.icon,
      humidity: main.humidity,
      windSpeed: wind.speed,
      city: response.name,
      country: response.sys.country,
      recommendation: this.getRecommendation(weather.main, main.temp),
      ionicIcon: this.getIonicIcon(weather.main),
      alertColor: this.getAlertColor(weather.main, main.temp)
    };

    return weatherData;
  }

  // Get recommendation based on weather
  private getRecommendation(weatherMain: string, temp: number): string {
    const recommendations: { [key: string]: string } = {
      'Clear': temp > 30 ? 'Sunny and hot today. Remember to bring a hat and water for your child' : 'Sunny today. Remember to bring a hat for your child',
      'Clouds': 'Cloudy today. Perfect weather for outdoor activities',
      'Rain': 'Rainy today. Don\'t forget an umbrella and raincoat for your child',
      'Drizzle': 'Light rain today. Bring an umbrella just in case',
      'Thunderstorm': 'Thunderstorm expected. Keep your child indoors if possible',
      'Snow': 'Snowy today. Dress your child warmly with winter clothes',
      'Mist': 'Misty conditions. Drive carefully and ensure good visibility',
      'Fog': 'Foggy weather. Take extra care when traveling',
      'Haze': 'Hazy conditions. Consider wearing a mask for your child'
    };

    return recommendations[weatherMain] || 'Check the weather before heading out';
  }

  // Get appropriate Ionic icon
  private getIonicIcon(weatherMain: string): string {
    const icons: { [key: string]: string } = {
      'Clear': 'sunny',
      'Clouds': 'cloudy',
      'Rain': 'rainy',
      'Drizzle': 'rainy',
      'Thunderstorm': 'thunderstorm',
      'Snow': 'snow',
      'Mist': 'cloudy',
      'Fog': 'cloudy',
      'Haze': 'cloudy'
    };

    return icons[weatherMain] || 'partly-sunny';
  }

  // Get alert color based on weather
  private getAlertColor(weatherMain: string, temp: number): string {
    if (weatherMain === 'Thunderstorm' || weatherMain === 'Snow') {
      return '#dc3545'; // Red for severe weather
    } else if (weatherMain === 'Rain' || weatherMain === 'Drizzle') {
      return '#007bff'; // Blue for rain
    } else if (temp > 35) {
      return '#fd7e14'; // Orange for very hot
    } else if (temp < 10) {
      return '#6f42c1'; // Purple for cold
    } else {
      return '#ffc107'; // Yellow for normal/sunny
    }
  }

  // Fallback weather data when API fails (Cebu Talisay City typical weather)
  private getFallbackWeather(): WeatherData {
    return {
      temperature: 30,
      description: 'partly cloudy',
      icon: '02d',
      humidity: 75,
      windSpeed: 2.8,
      city: 'Talisay',
      country: 'PH',
      recommendation: 'Warm and humid weather in Cebu. Remember to bring water and a hat for your child',
      ionicIcon: 'partly-sunny',
      alertColor: '#ffc107'
    };
  }
}
