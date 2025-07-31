import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  private syncStatusSubject = new BehaviorSubject<string>('idle');
  public syncStatus$ = this.syncStatusSubject.asObservable();

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  // Setup network status listeners
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
    });
  }

  // Start periodic sync when online
  private startPeriodicSync() {
    setInterval(() => {
      if (this.isOnlineSubject.value) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  // Get current online status
  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  // Sync all data when online
  async syncWhenOnline() {
    if (!this.isOnline) return;

    this.syncStatusSubject.next('syncing');

    try {
      await Promise.all([
        this.syncPickupLogs(),
        this.syncWeatherData(),
        this.syncScheduleData(),
        this.syncFamilyData()
      ]);

      this.syncStatusSubject.next('completed');
      console.log('All data synced successfully');
    } catch (error) {
      this.syncStatusSubject.next('error');
      console.error('Error during sync:', error);
    }
  }

  // Sync pickup logs
  async syncPickupLogs(): Promise<void> {
    try {
      const pendingLogs = this.getPendingLogsToSync();

      if (pendingLogs.length > 0) {
        console.log(`Syncing ${pendingLogs.length} pickup logs...`);

        // In a real app, send to server
        // await this.sendLogsToServer(pendingLogs);

        // Mark as synced
        this.markLogsAsSynced(pendingLogs);

        // Add sync timestamp
        this.updateLastSyncTime('pickupLogs');
      }
    } catch (error) {
      console.error('Error syncing pickup logs:', error);
      throw error;
    }
  }

  // Sync weather data
  async syncWeatherData(): Promise<void> {
    try {
      console.log('Syncing weather data...');

      // Check if weather data needs update (older than 30 minutes)
      const lastUpdate = this.getLastSyncTime('weatherData');
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

      if (!lastUpdate || lastUpdate < thirtyMinutesAgo) {
        const weatherData = await this.fetchWeatherData();
        localStorage.setItem('weatherData', JSON.stringify(weatherData));
        this.updateLastSyncTime('weatherData');
        console.log('Weather data updated');
      }
    } catch (error) {
      console.error('Error syncing weather data:', error);
      throw error;
    }
  }

  // Sync schedule data
  async syncScheduleData(): Promise<void> {
    try {
      console.log('Syncing schedule data...');

      // In a real app, sync with server
      // const serverSchedules = await this.fetchSchedulesFromServer();
      // this.mergeScheduleData(serverSchedules);

      this.updateLastSyncTime('scheduleData');
    } catch (error) {
      console.error('Error syncing schedule data:', error);
      throw error;
    }
  }

  // Sync family data
  async syncFamilyData(): Promise<void> {
    try {
      console.log('Syncing family data...');

      // In a real app, sync with server
      // const serverFamilyData = await this.fetchFamilyDataFromServer();
      // this.mergeFamilyData(serverFamilyData);

      this.updateLastSyncTime('familyData');
    } catch (error) {
      console.error('Error syncing family data:', error);
      throw error;
    }
  }

  // Get pending logs to sync
  private getPendingLogsToSync(): any[] {
    const logs = localStorage.getItem('pickupLogs');
    if (logs) {
      try {
        const parsedLogs = JSON.parse(logs);
        return parsedLogs.filter((log: any) => !log.synced);
      } catch (error) {
        console.error('Error parsing logs for sync:', error);
      }
    }
    return [];
  }

  // Mark logs as synced
  private markLogsAsSynced(logs: any[]) {
    const allLogs = localStorage.getItem('pickupLogs');
    if (allLogs) {
      try {
        const parsedLogs = JSON.parse(allLogs);
        const syncedIds = logs.map(log => log.id);

        const updatedLogs = parsedLogs.map((log: any) => {
          if (syncedIds.includes(log.id)) {
            return { ...log, synced: true, syncedAt: new Date().toISOString() };
          }
          return log;
        });

        localStorage.setItem('pickupLogs', JSON.stringify(updatedLogs));
      } catch (error) {
        console.error('Error marking logs as synced:', error);
      }
    }
  }

  // Fetch weather data
  private async fetchWeatherData(): Promise<any> {
    // Simulate weather API call
    return {
      temperature: Math.floor(Math.random() * 10) + 25, // 25-35°C
      condition: 'Partly Cloudy',
      humidity: Math.floor(Math.random() * 20) + 70, // 70-90%
      windSpeed: Math.floor(Math.random() * 5) + 2, // 2-7 km/h
      city: 'Talisay',
      country: 'PH',
      lastUpdated: new Date().toISOString(),
      recommendation: 'Warm and humid weather in Cebu. Remember to bring water and a hat for your child',
      ionicIcon: 'partly-sunny',
      alertColor: '#ffc107'
    };
  }

  // Update last sync time
  private updateLastSyncTime(dataType: string) {
    const syncTimes = this.getSyncTimes();
    syncTimes[dataType] = Date.now();
    localStorage.setItem('syncTimes', JSON.stringify(syncTimes));
  }

  // Get last sync time
  private getLastSyncTime(dataType: string): number | null {
    const syncTimes = this.getSyncTimes();
    return syncTimes[dataType] || null;
  }

  // Get all sync times
  private getSyncTimes(): any {
    const stored = localStorage.getItem('syncTimes');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing sync times:', error);
      }
    }
    return {};
  }

  // Force sync all data
  async forceSyncAll(): Promise<void> {
    if (this.isOnline) {
      await this.syncWhenOnline();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Get sync status
  getSyncStatus(): string {
    return this.syncStatusSubject.value;
  }

  // Check if data needs sync
  needsSync(dataType: string, maxAgeMinutes: number = 30): boolean {
    const lastSync = this.getLastSyncTime(dataType);
    if (!lastSync) return true;

    const maxAge = maxAgeMinutes * 60 * 1000;
    return (Date.now() - lastSync) > maxAge;
  }
}
