import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

interface ScheduleItem {
  id: string;
  date: string;
  name: string;
  day: string;
  time: string;
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

interface MonthGroup {
  month: string;
  year: string;
  schedules: ScheduleItem[];
}

@Component({
  selector: 'app-view-schedule',
  templateUrl: './view-schedule.page.html',
  styleUrls: ['./view-schedule.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ViewSchedulePage implements OnInit {

  monthGroups: MonthGroup[] = [];
  hasSchedules: boolean = false;
  selectedSchedules: Set<string> = new Set();
  isSelectionMode: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadSchedules();
  }

  ionViewWillEnter() {
    // Refresh data every time the page is entered
    this.loadSchedules();
  }

  // Load schedules from localStorage
  loadSchedules() {
    const stored = localStorage.getItem('schedules');
    console.log('Loading schedules from localStorage:', stored);

    if (stored && stored !== 'null' && stored !== '[]') {
      try {
        const schedules: StoredSchedule[] = JSON.parse(stored);
        console.log('Parsed schedules:', schedules);

        this.hasSchedules = schedules.length > 0;

        if (this.hasSchedules) {
          this.monthGroups = this.groupSchedulesByMonth(schedules);
          console.log('Month groups created:', this.monthGroups);
        } else {
          this.monthGroups = [];
        }
      } catch (error) {
        console.error('Error parsing schedules:', error);
        this.hasSchedules = false;
        this.monthGroups = [];
      }
    } else {
      console.log('No schedules found in localStorage');
      this.hasSchedules = false;
      this.monthGroups = [];
    }
  }

  // Group schedules by month and year
  groupSchedulesByMonth(schedules: StoredSchedule[]): MonthGroup[] {
    const groups: { [key: string]: MonthGroup } = {};

    schedules.forEach(schedule => {
      console.log('Processing schedule:', schedule);
      const date = new Date(schedule.fullDate);
      console.log('Parsed date:', date);

      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear().toString();

      if (!groups[monthYear]) {
        groups[monthYear] = {
          month: monthName,
          year: year,
          schedules: []
        };
      }

      groups[monthYear].schedules.push({
        id: schedule.id,
        date: date.getDate().toString().padStart(2, '0'),
        name: schedule.fetcher,
        day: this.getDayName(schedule.day),
        time: schedule.time
      });
    });

    // Convert to array and sort by date
    const result = Object.values(groups).sort((a, b) => {
      const dateA = new Date(`${a.year}-${this.getMonthNumber(a.month)}-01`);
      const dateB = new Date(`${b.year}-${this.getMonthNumber(b.month)}-01`);
      return dateA.getTime() - dateB.getTime();
    });

    // Sort schedules within each month by date
    result.forEach(monthGroup => {
      monthGroup.schedules.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    });

    console.log('Final grouped result:', result);
    return result;
  }

  // Toggle selection mode
  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.selectedSchedules.clear();
    }
  }

  // Toggle schedule selection
  toggleScheduleSelection(scheduleId: string) {
    if (this.selectedSchedules.has(scheduleId)) {
      this.selectedSchedules.delete(scheduleId);
    } else {
      this.selectedSchedules.add(scheduleId);
    }
  }

  // Check if schedule is selected
  isScheduleSelected(scheduleId: string): boolean {
    return this.selectedSchedules.has(scheduleId);
  }

  // Delete selected schedules
  deleteSelectedSchedules() {
    if (this.selectedSchedules.size === 0) return;

    const stored = localStorage.getItem('schedules');
    if (stored) {
      const schedules: StoredSchedule[] = JSON.parse(stored);
      const filteredSchedules = schedules.filter(schedule =>
        !this.selectedSchedules.has(schedule.id)
      );

      localStorage.setItem('schedules', JSON.stringify(filteredSchedules));
      this.selectedSchedules.clear();
      this.isSelectionMode = false;
      this.loadSchedules();
    }
  }

  // Delete single schedule
  deleteSchedule(scheduleId: string) {
    const stored = localStorage.getItem('schedules');
    if (stored) {
      const schedules: StoredSchedule[] = JSON.parse(stored);
      const filteredSchedules = schedules.filter(schedule => schedule.id !== scheduleId);

      localStorage.setItem('schedules', JSON.stringify(filteredSchedules));
      this.loadSchedules();
    }
  }

  // Helper methods
  getDayName(dayAbbr: string): string {
    const dayMap: { [key: string]: string } = {
      'Mon': 'Monday',
      'Tues': 'Tuesday',
      'Wed': 'Wednesday',
      'Thur': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    return dayMap[dayAbbr] || dayAbbr;
  }

  getMonthNumber(monthName: string): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return (months.indexOf(monthName) + 1).toString().padStart(2, '0');
  }

  // Clear all schedules (for testing)
  clearSchedules() {
    localStorage.removeItem('schedules');
    this.loadSchedules();
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/inside-schedule']);
  }

  goHome() {
    this.router.navigate(['/schedule']);
  }

  goToFamily() {
    console.log('Family clicked');
    this.router.navigate(['/family']);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  goToDocuments() {
    console.log('Documents clicked');
    this.router.navigate(['/pickup-log']);
  }

  goToSettings() {
    console.log('Settings clicked');
    this.router.navigate(['/settings']);
  }

  panicAlert() {
    console.log('Panic button clicked!');
    // Add panic alert functionality here
    alert('Emergency alert activated! Contacting emergency contacts...');
  }
}
