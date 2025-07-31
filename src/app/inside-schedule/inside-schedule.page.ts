import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { FirebaseService, Schedule } from '../services/firebase.service';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-inside-schedule',
  templateUrl: './inside-schedule.page.html',
  styleUrls: ['./inside-schedule.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class InsideSchedulePage implements OnInit {
  selectedFetcher: string = '';
  selectedDays: string[] = [];
  selectedDate: string = '';
  selectedTime: string = '';
  timeFormat: string = 'AM';
  showDatePicker: boolean = false;
  showTimePicker: boolean = false;
  availableTimes: string[] = [];
  minDate: string = '';
  customTime: string = '';
  highlightedDates: string[] = [];
  availableFetchers: FamilyMember[] = [];

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.setMinDate();
    this.generateAvailableTimes();
    this.loadAvailableFetchers();
  }

  ionViewWillEnter() {
    // Refresh family members when entering the page
    this.loadAvailableFetchers();
  }

  // Set minimum date to today
  setMinDate() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  // Generate available time slots based on current time
  generateAvailableTimes() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const times: string[] = [];

    // If it's today, start from next hour, otherwise start from 9 AM
    let startHour = 9;
    if (this.selectedDate === this.minDate) {
      startHour = currentHour + 1;
      if (currentMinute > 0) {
        startHour = currentHour + 1;
      }
    }

    // Generate times from start hour to 12 PM (noon)
    for (let hour = startHour; hour <= 12; hour++) {
      if (hour <= 12) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        times.push(`${displayHour}:00 ${period}`);

        // Add 30-minute intervals
        if (hour < 12) {
          times.push(`${displayHour}:30 ${period}`);
        }
      }
    }

    // Add PM times from 1 PM to 6 PM
    for (let hour = 13; hour <= 18; hour++) {
      const displayHour = hour - 12;
      times.push(`${displayHour}:00 PM`);
      times.push(`${displayHour}:30 PM`);
    }

    this.availableTimes = times;
  }

  // Load available family members for fetcher selection
  loadAvailableFetchers() {
    // Load family members from localStorage
    const storedMembers = localStorage.getItem('familyMembers');
    let manualMembers: FamilyMember[] = [];

    if (storedMembers) {
      try {
        manualMembers = JSON.parse(storedMembers);
      } catch (error) {
        console.error('Error parsing family members:', error);
      }
    }

    // Generate family members from app data (same logic as family page)
    const generatedMembers = this.generateFamilyMembersFromAppData();

    // Combine manual and generated members, avoiding duplicates
    const allMembers = [...manualMembers, ...generatedMembers];
    this.availableFetchers = this.removeDuplicateMembers(allMembers);

    // Exclude all protected members from fetcher selection
    this.availableFetchers = this.availableFetchers.filter(member => {
      // Exclude the main child (Daveryle)
      if (member.id === 'main-child') {
        return false;
      }
      // Exclude the guardian (Rylenerez)
      if (member.id === 'guardian-parent') {
        return false;
      }
      // Exclude the protected child (Maria)
      if (member.id === 'removable-child') {
        return false;
      }
      // Include all other members
      return true;
    });

    // If no fetchers available, provide default options
    if (this.availableFetchers.length === 0) {
      this.availableFetchers = [
        { id: 'default-1', name: 'Ana', role: 'Caregiver', phone: 'Not provided', email: 'Not provided' },
        { id: 'default-2', name: 'John', role: 'Fetcher', phone: 'Not provided', email: 'Not provided' },
        { id: 'default-3', name: 'Sarah', role: 'Caregiver', phone: 'Not provided', email: 'Not provided' }
      ];
    }
  }

  // Generate family members from current app data
  generateFamilyMembersFromAppData(): FamilyMember[] {
    const members: FamilyMember[] = [];
    const exclusionList = this.getExclusionList();

    // Get fetchers from existing schedules
    const scheduleData = localStorage.getItem('schedules');
    if (scheduleData) {
      try {
        const schedules = JSON.parse(scheduleData);
        const fetcherNames = new Set<string>();

        schedules.forEach((schedule: any) => {
          if (schedule.fetcher) {
            fetcherNames.add(schedule.fetcher);
          }
        });

        // Add fetchers as family members (if not excluded)
        fetcherNames.forEach(name => {
          if (!exclusionList.includes(name.toLowerCase())) {
            members.push({
              id: `fetcher-${name.toLowerCase().replace(/\s+/g, '-')}`,
              name: name,
              role: this.determineFetcherRole(name),
              phone: 'Not provided',
              email: 'Not provided'
            });
          }
        });
      } catch (error) {
        console.error('Error parsing schedule data:', error);
      }
    }

    return members;
  }

  // Determine fetcher role based on name patterns
  determineFetcherRole(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('yaya') || lowerName.includes('nanny')) {
      return 'Caregiver';
    } else if (lowerName.includes('driver')) {
      return 'Driver';
    } else if (lowerName.includes('ana') || lowerName.includes('maria') || lowerName.includes('marie')) {
      return 'Caregiver';
    } else if (lowerName.includes('dave') || lowerName.includes('david')) {
      return 'Guardian';
    } else {
      return 'Fetcher';
    }
  }

  // Remove duplicate members based on name
  removeDuplicateMembers(members: FamilyMember[]): FamilyMember[] {
    const seen = new Set<string>();
    return members.filter(member => {
      const key = member.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Get exclusion list
  getExclusionList(): string[] {
    // Always exclude protected family members from schedule selection
    const protectedMembers = [
      'daveryle enerez',    // Main child
      'rylenerez enerez',   // Guardian
      'maria enerez'        // Protected child
    ];

    const stored = localStorage.getItem('excludedFamilyMembers');
    let userExclusions: string[] = [];

    if (stored) {
      try {
        userExclusions = JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing exclusion list:', error);
      }
    }

    // Combine protected members with user exclusions
    return [...protectedMembers, ...userExclusions];
  }

  // Toggle day selection
  toggleDay(day: string) {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }

    // Update highlighted dates when days change
    this.updateHighlightedDates();
  }

  // Update highlighted dates based on selected days
  updateHighlightedDates() {
    if (this.selectedDays.length === 0) {
      this.highlightedDates = [];
      return;
    }

    const dates: string[] = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 6); // Show 6 months ahead

    // Convert day abbreviations to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tues': 2, 'Wed': 3, 'Thur': 4, 'Fri': 5, 'Sat': 6
    };

    const selectedDayNumbers = this.selectedDays.map(day => dayMap[day]);

    // Generate all dates that match the selected days
    const currentDate = new Date(today);
    while (currentDate <= endDate) {
      if (selectedDayNumbers.includes(currentDate.getDay())) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.highlightedDates = dates;
    console.log('Highlighted dates for selected days:', this.highlightedDates);
  }

  // Check if a date should be enabled for selection
  isDateEnabled = (dateString: string) => {
    // If no days are selected, disable all dates
    if (this.selectedDays.length === 0) {
      return false;
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    // Convert day abbreviations to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tues': 2, 'Wed': 3, 'Thur': 4, 'Fri': 5, 'Sat': 6
    };

    const selectedDayNumbers = this.selectedDays.map(day => dayMap[day]);

    // Only enable dates that match the selected days
    return selectedDayNumbers.includes(dayOfWeek);
  }

  // Open date picker
  openDatePicker() {
    if (this.selectedDays.length === 0) {
      alert('Please select at least one day first');
      return;
    }

    // Update highlighted dates before opening picker
    this.updateHighlightedDates();
    this.showDatePicker = true;
  }

  // Handle date selection
  onDateChange(event: any) {
    const rawDate = event.detail.value.split('T')[0]; // Get YYYY-MM-DD format
    console.log('Date selected:', rawDate);

    this.showDatePicker = false;
    this.generateAvailableTimes(); // Regenerate times based on selected date

    // Store the raw date for processing, but format for display
    const date = new Date(rawDate);
    this.selectedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    console.log('Formatted date for display:', this.selectedDate);
  }

  // Open time picker
  openTimePicker() {
    this.showTimePicker = true;
  }

  // Select time
  selectTime(time: string) {
    this.selectedTime = time;
    this.showTimePicker = false;
  }

  // Select custom time
  selectCustomTime() {
    if (this.customTime) {
      // Convert 24-hour format to 12-hour format with AM/PM
      const [hours, minutes] = this.customTime.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 < 12 ? 'AM' : 'PM';

      this.selectedTime = `${hour12}:${minutes} ${period}`;
      this.showTimePicker = false;
    }
  }

  // Check if form is valid
  isFormValid(): boolean {
    return !!(this.selectedFetcher &&
             this.selectedDays.length > 0 &&
             this.selectedDate &&
             this.selectedTime);
  }

  // Save schedule to Firebase
  async saveSchedule() {
    if (this.isFormValid()) {
      // Check for time conflicts
      const conflicts = this.checkTimeConflicts();
      if (conflicts.length > 0) {
        alert(`Time conflict detected! The following days already have schedules at ${this.selectedTime}:\n${conflicts.join(', ')}`);
        return;
      }

      try {
        // Create schedule entries for each selected day
        const schedulePromises = this.selectedDays.map(async (day) => {
          const fullDate = this.parseDate(this.selectedDate, day);

          const scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
            fetcher: this.selectedFetcher,
            day: day,
            date: this.selectedDate,
            time: this.selectedTime,
            fullDate: fullDate,
            childName: 'Default Child', // You might want to add child selection to the form
            pickupPerson: this.selectedFetcher,
            pickupTime: this.selectedTime,
            pickupDate: fullDate,
            location: 'Cebu Talisay City', // Default location from memories
            notes: `Scheduled for ${day}`,
            status: 'pending'
          };

          // Save to Firebase
          const scheduleId = await this.firebaseService.createSchedule(scheduleData);

          // Create legacy format for localStorage compatibility
          const legacySchedule = {
            id: scheduleId,
            fetcher: this.selectedFetcher,
            day: day,
            date: this.selectedDate,
            time: this.selectedTime,
            fullDate: fullDate,
            createdAt: new Date().toISOString(),
            firebaseId: scheduleId
          };

          return { scheduleId, legacySchedule };
        });

        // Wait for all schedules to be saved
        const savedSchedules = await Promise.all(schedulePromises);

        // Update localStorage for backward compatibility
        const existingSchedules = this.getStoredSchedules();
        const legacySchedules = savedSchedules.map(s => s.legacySchedule);
        const updatedSchedules = [...existingSchedules, ...legacySchedules];
        updatedSchedules.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
        localStorage.setItem('schedules', JSON.stringify(updatedSchedules));

        // Create notifications for each new schedule
        savedSchedules.forEach(({ legacySchedule }) => {
          const formattedDate = new Date(legacySchedule.fullDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          this.notificationService.addScheduleCreatedNotification(
            legacySchedule.fetcher,
            formattedDate,
            legacySchedule.time,
            legacySchedule.id
          );
        });

        console.log('Schedules saved to Firebase successfully');
        console.log(`Fetcher: ${this.selectedFetcher}`);
        console.log(`Days: ${this.selectedDays.join(', ')}`);
        console.log(`Date: ${this.selectedDate}`);
        console.log(`Time: ${this.selectedTime}`);

        alert('Schedule saved successfully!');

        // Navigate to view schedule page
        this.router.navigate(['/view-schedule']);
      } catch (error) {
        console.error('Error saving schedule to Firebase:', error);
        alert('Error saving schedule. Please try again.');
      }
    } else {
      console.log('Please fill in all the fields.');
    }
  }

  // Check for time conflicts
  private checkTimeConflicts(): string[] {
    const existingSchedules = this.getStoredSchedules();
    const conflicts: string[] = [];

    this.selectedDays.forEach(day => {
      const conflict = existingSchedules.find(schedule =>
        schedule.day === day &&
        schedule.date === this.selectedDate &&
        schedule.time === this.selectedTime
      );

      if (conflict) {
        conflicts.push(day);
      }
    });

    return conflicts;
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getStoredSchedules(): any[] {
    const stored = localStorage.getItem('schedules');
    return stored ? JSON.parse(stored) : [];
  }

  private parseDate(dateString: string, _dayName: string): string {
    console.log('Parsing date:', dateString);

    // If dateString is in format like "Dec 15, 2024", parse it
    if (dateString.includes(',')) {
      const parsedDate = new Date(dateString);
      console.log('Parsed date with comma:', parsedDate);
      return parsedDate.toISOString();
    }

    // If it's in YYYY-MM-DD format (from date picker)
    if (dateString.includes('-') && dateString.length === 10) {
      const parsedDate = new Date(dateString + 'T00:00:00.000Z');
      console.log('Parsed ISO date:', parsedDate);
      return parsedDate.toISOString();
    }

    // Otherwise, assume it's a future date and create a proper date
    const today = new Date();
    const currentYear = today.getFullYear();
    const fallbackDate = new Date(currentYear, today.getMonth(), parseInt(dateString) || today.getDate());
    console.log('Fallback date:', fallbackDate);
    return fallbackDate.toISOString();
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/schedule']);
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
