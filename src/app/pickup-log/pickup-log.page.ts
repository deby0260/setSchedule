import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

interface PickupLog {
  id: string;
  date: string;
  time: string;
  message: string;
  person: string;
  timestamp: string;
  scheduleId?: string;
}

interface StoredSchedule {
  id: string;
  fetcher: string;
  day: string;
  date: string;
  time: string;
  fullDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-pickup-log',
  templateUrl: './pickup-log.page.html',
  styleUrls: ['./pickup-log.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PickupLogPage implements OnInit {

  todayLogs: PickupLog[] = [];
  yesterdayLogs: PickupLog[] = [];
  olderLogs: PickupLog[] = [];

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadPickupLogs();
  }

  ionViewWillEnter() {
    // Refresh logs when entering the page
    this.loadPickupLogs();
  }

  // Load pickup logs from localStorage and generate from schedule data
  loadPickupLogs() {
    // First, load existing logs
    const storedLogs = localStorage.getItem('pickupLogs');
    let existingLogs: PickupLog[] = [];

    if (storedLogs) {
      try {
        existingLogs = JSON.parse(storedLogs);
      } catch (error) {
        console.error('Error parsing pickup logs:', error);
      }
    }

    // Generate logs from schedule data
    const scheduleData = localStorage.getItem('schedules');
    let generatedLogs: PickupLog[] = [];

    if (scheduleData) {
      try {
        const schedules: StoredSchedule[] = JSON.parse(scheduleData);
        generatedLogs = this.generatePickupLogs(schedules);
      } catch (error) {
        console.error('Error parsing schedule data:', error);
      }
    }

    // Combine existing and generated logs
    const allLogs = [...existingLogs, ...generatedLogs];

    // Remove duplicates based on schedule ID
    const uniqueLogs = this.removeDuplicateLogs(allLogs);

    // Sort by timestamp (newest first)
    uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group logs by date
    this.groupLogsByDate(uniqueLogs);

    // Save updated logs
    this.savePickupLogs(uniqueLogs);
  }

  // Generate pickup logs from schedule data
  generatePickupLogs(schedules: StoredSchedule[]): PickupLog[] {
    const logs: PickupLog[] = [];
    const now = new Date();

    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.fullDate);
      const scheduleTime = this.parseTime(schedule.time);
      const scheduleDatetime = new Date(scheduleDate);
      scheduleDatetime.setHours(scheduleTime.hours, scheduleTime.minutes, 0, 0);

      // Only generate logs for past schedules
      if (scheduleDatetime <= now) {
        // Generate pickup completion log (30 minutes after scheduled time)
        const pickupTime = new Date(scheduleDatetime.getTime() + 30 * 60000);

        logs.push({
          id: `pickup-${schedule.id}`,
          date: this.formatLogDate(pickupTime),
          time: schedule.time,
          message: `${schedule.fetcher} picked up`,
          person: 'Daveryle Enerez',
          timestamp: pickupTime.toISOString(),
          scheduleId: schedule.id
        });
      }
    });

    return logs;
  }

  // Parse time string to hours and minutes
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

  // Format date for log display
  formatLogDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Remove duplicate logs
  removeDuplicateLogs(logs: PickupLog[]): PickupLog[] {
    const seen = new Set<string>();
    return logs.filter(log => {
      if (log.scheduleId) {
        const key = `pickup-${log.scheduleId}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
      }
      return true;
    });
  }

  // Group logs by date (today, yesterday, older)
  groupLogsByDate(logs: PickupLog[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    this.todayLogs = [];
    this.yesterdayLogs = [];
    this.olderLogs = [];

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

      if (logDateOnly.getTime() === today.getTime()) {
        this.todayLogs.push(log);
      } else if (logDateOnly.getTime() === yesterday.getTime()) {
        this.yesterdayLogs.push(log);
      } else {
        this.olderLogs.push(log);
      }
    });
  }

  // Save pickup logs to localStorage
  savePickupLogs(logs: PickupLog[]) {
    // Only save non-schedule generated logs to avoid duplication
    const persistentLogs = logs.filter(log => !log.scheduleId);
    localStorage.setItem('pickupLogs', JSON.stringify(persistentLogs));
  }

  // Remove a log
  removeLog(logId: string) {
    // Remove from current arrays
    this.todayLogs = this.todayLogs.filter(log => log.id !== logId);
    this.yesterdayLogs = this.yesterdayLogs.filter(log => log.id !== logId);
    this.olderLogs = this.olderLogs.filter(log => log.id !== logId);

    // Update localStorage
    const allLogs = [...this.todayLogs, ...this.yesterdayLogs, ...this.olderLogs];
    this.savePickupLogs(allLogs);
  }

  // Navigation methods
  goHome() {
    this.router.navigate(['/schedule']);
  }

  goToFamily() {
    console.log('Family clicked');
    this.router.navigate(['/family']);
  }

  goToSettings() {
    console.log('Settings clicked');
    this.router.navigate(['/settings']);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  goToDocuments() {
    // Already on documents page
    console.log('Already on Documents page');
  }

  panicAlert() {
    console.log('Panic button clicked!');
    // Add panic alert functionality here
    alert('Emergency alert activated! Contacting emergency contacts...');
  }
}
