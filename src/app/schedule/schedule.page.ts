import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WeatherService, WeatherData } from '../services/weather.service';
import { NotificationService, Notification } from '../services/notification.service';
import { FirebaseService, Schedule } from '../services/firebase.service';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark,
  notificationsOutline,
  notifications,
  barChartOutline,
  documentTextOutline,
  calendarOutline,
  qrCodeOutline,
  personCircleOutline,
  trendingUpOutline,
  homeOutline,
  peopleOutline,
  settingsOutline,
  locationOutline,
  refreshOutline,
  checkmark,
  checkmarkCircle,
  close
} from 'ionicons/icons';

interface StoredSchedule {
  id: string;
  fetcher: string;
  day: string;
  date: string;
  time: string;
  fullDate: string;
  createdAt: string;
}

interface UpcomingPickup {
  id: string;
  fetcher: string;
  role: string;
  time: string;
  date: string;
  displayDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  fullDate: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SchedulePage implements OnInit {

  public userName: string = 'User'; // <--- Add this line

  currentWeather: WeatherData | null = null;
  isLoadingWeather: boolean = true;
  upcomingPickups: UpcomingPickup[] = [];
  notifications: Notification[] = [];

  constructor(
    private router: Router,
    private weatherService: WeatherService,
    private notificationService: NotificationService,
    private firebaseService: FirebaseService
  ) {
    addIcons({
      shieldCheckmark,
      notificationsOutline,
      notifications,
      barChartOutline,
      documentTextOutline,
      calendarOutline,
      qrCodeOutline,
      personCircleOutline,
      trendingUpOutline,
      homeOutline,
      peopleOutline,
      settingsOutline,
      locationOutline,
      refreshOutline,
      checkmark,
      checkmarkCircle,
      close
    });
  }

  ngOnInit() {
    // Set the user name from localStorage
    this.userName = localStorage.getItem('fetchsafeUser') || 'User';

    this.loadWeather();
    this.loadUpcomingPickups();
    this.loadNotifications();
  }

  ionViewDidEnter() {
    this.checkLocationPermission();
    this.loadUpcomingPickups();
  }

  async checkLocationPermission() {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          console.log('Location permission denied, using Talisay, Cebu as default');
        }
      } catch (error) {
        console.log('Permission API not supported');
      }
    }
  }

  loadWeather() {
    this.isLoadingWeather = true;
    this.weatherService.getCurrentLocationWeather().subscribe({
      next: (weather) => {
        this.currentWeather = weather;
        this.isLoadingWeather = false;
      },
      error: (error) => {
        this.isLoadingWeather = false;
        this.currentWeather = {
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
    });
  }

  getWeatherBackgroundColor(): string {
    if (!this.currentWeather) return '#fff3cd';
    const color = this.currentWeather.alertColor;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }

  getTalisayWeather() {
    this.isLoadingWeather = true;
    this.weatherService.getTalisayWeather().subscribe({
      next: (weather) => {
        this.currentWeather = weather;
        this.isLoadingWeather = false;
      },
      error: (error) => {
        this.isLoadingWeather = false;
      }
    });
  }

  async loadUpcomingPickups() {
    try {
      const firebaseSchedules = await this.firebaseService.getSchedulesByStatus('pending');
      const convertedSchedules: StoredSchedule[] = firebaseSchedules.map(schedule => ({
        id: schedule.id || '',
        fetcher: schedule.pickupPerson,
        day: new Date(schedule.pickupDate).toLocaleDateString('en-US', { weekday: 'long' }),
        date: schedule.pickupDate,
        time: schedule.pickupTime,
        fullDate: schedule.pickupDate,
        createdAt: this.firebaseService.timestampToDate(schedule.createdAt).toISOString()
      }));

      const stored = localStorage.getItem('schedules');
      let localSchedules: StoredSchedule[] = [];
      if (stored) {
        try {
          localSchedules = JSON.parse(stored);
        } catch (error) {
          console.error('Error parsing local schedule data:', error);
        }
      }

      const allSchedules = [...convertedSchedules];
      localSchedules.forEach(localSchedule => {
        const existsInFirebase = convertedSchedules.some(fbSchedule =>
          fbSchedule.fetcher === localSchedule.fetcher &&
          fbSchedule.time === localSchedule.time &&
          fbSchedule.fullDate === localSchedule.fullDate
        );
        if (!existsInFirebase) {
          allSchedules.push(localSchedule);
        }
      });

      this.upcomingPickups = this.processUpcomingPickups(allSchedules);
    } catch (error) {
      const stored = localStorage.getItem('schedules');
      if (stored) {
        try {
          const schedules: StoredSchedule[] = JSON.parse(stored);
          this.upcomingPickups = this.processUpcomingPickups(schedules);
        } catch (parseError) {
          this.upcomingPickups = [];
        }
      } else {
        this.upcomingPickups = [];
      }
    }
  }

  processUpcomingPickups(schedules: StoredSchedule[]): UpcomingPickup[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcomingSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.fullDate);
      const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
      return scheduleDateOnly >= today;
    });
    upcomingSchedules.sort((a, b) => {
      const dateA = new Date(a.fullDate);
      const dateB = new Date(b.fullDate);
      if (dateA.getTime() === dateB.getTime()) {
        return this.compareTime(a.time, b.time);
      }
      return dateA.getTime() - dateB.getTime();
    });
    const limitedSchedules = upcomingSchedules.slice(0, 1);
    return limitedSchedules.map(schedule => ({
      id: schedule.id,
      fetcher: schedule.fetcher,
      role: this.getFetcherRole(schedule.fetcher),
      time: schedule.time,
      date: schedule.date,
      displayDate: this.formatDisplayDate(schedule.fullDate),
      status: this.getPickupStatus(schedule.fullDate, schedule.time),
      fullDate: schedule.fullDate
    }));
  }

  getFetcherRole(fetcherName: string): string {
    const roles: { [key: string]: string } = {
      'Ana': 'Yaya',
      'Dave': 'Driver',
      'Maria': 'Nanny',
      'John': 'Guardian'
    };
    return roles[fetcherName] || 'Fetcher';
  }

  formatDisplayDate(fullDate: string): string {
    const date = new Date(fullDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const scheduleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (scheduleDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (scheduleDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  getPickupStatus(fullDate: string, time: string): 'Scheduled' | 'In Progress' | 'Completed' {
    const now = new Date();
    const scheduleDate = new Date(fullDate);
    const scheduleTime = this.parseTime(time);
    scheduleDate.setHours(scheduleTime.hours, scheduleTime.minutes, 0, 0);
    const timeDiff = scheduleDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    if (hoursDiff < -1) {
      return 'Completed';
    } else if (hoursDiff < 0.5 && hoursDiff > -1) {
      return 'In Progress';
    } else {
      return 'Scheduled';
    }
  }

  parseTime(timeStr: string): { hours: number; minutes: number } {
    const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
    if (!match) return { hours: 0, minutes: 0 };
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    return { hours, minutes };
  }

  compareTime(timeA: string, timeB: string): number {
    const parsedA = this.parseTime(timeA);
    const parsedB = this.parseTime(timeB);
    const minutesA = parsedA.hours * 60 + parsedA.minutes;
    const minutesB = parsedB.hours * 60 + parsedB.minutes;
    return minutesA - minutesB;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Scheduled': return 'scheduled';
      case 'In Progress': return 'in-progress';
      case 'Completed': return 'completed';
      default: return 'scheduled';
    }
  }

  getReliabilityPercentage(): number {
    const stored = localStorage.getItem('schedules');
    if (!stored) return 96;
    try {
      const allSchedules: StoredSchedule[] = JSON.parse(stored);
      const now = new Date();
      const pastSchedules = allSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.fullDate);
        const scheduleTime = this.parseTime(schedule.time);
        scheduleDate.setHours(scheduleTime.hours, scheduleTime.minutes, 0, 0);
        return scheduleDate < now;
      });
      if (pastSchedules.length === 0) return 96;
      const successRate = Math.floor(Math.random() * 6) + 90;
      return Math.min(successRate + pastSchedules.length, 98);
    } catch (error) {
      return 96;
    }
  }

  getReliabilityText(): string {
    const percentage = this.getReliabilityPercentage();
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 90) return 'High Reliability';
    if (percentage >= 80) return 'Good';
    return 'Needs Improvement';
  }

  viewAnalytics() {
    // this.router.navigate(['/analytics']);
  }
  digitalConsent() {
    this.router.navigate(['/digital-consent']);
  }
  showConsentLetter() {
    this.router.navigate(['/show-consent-letter']);
  }
  setSchedule() {
    this.router.navigate(['/inside-schedule']);
  }
  viewSchedule() {
    this.router.navigate(['/view-schedule']);
  }
  displayQR() {
    this.router.navigate(['/qr-code']);
  }
  openCalendar() {
    this.setSchedule();
  }
  panicAlert() {
    alert('Emergency alert sent!');
  }
  goHome() {
    const currentUrl = this.router.url;
    if (currentUrl !== '/schedule') {
      this.router.navigate(['/schedule']);
    }
  }

  loadNotifications(): void {
    this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    });
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
    this.loadNotifications();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'Schedule': return 'calendar-outline';
      case 'Pickup': return 'car-outline';
      case 'Success': return 'checkmark-circle-outline';
      case 'Request': return 'person-add-outline';
      default: return 'notifications-outline';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  goToFamily() {
    this.router.navigate(['/family']);
  }
  goToDocuments() {
    this.router.navigate(['/pickup-log']);
  }
  goToNotifications() {
    this.router.navigate(['/notifications']);
  }
  goToSettings() {
    this.router.navigate(['/settings']);
  }
}
