import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonicModule } from '@ionic/angular'; // Import necessary Ionic components
import { Router } from '@angular/router';

@Component({
  selector: 'app-inside-schedule',
  templateUrl: './inside-schedule.page.html',
  styleUrls: ['./inside-schedule.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule] // Ensure IonicModule is imported here
})
export class InsideSchedulePage implements OnInit {
  fetcherName: string | undefined;
  selectedDay: string | undefined;
  scheduleDate: string | undefined;
  scheduleTime: string | undefined;

  constructor() {}

  ngOnInit() {}

  // Function to handle saving the schedule
  saveSchedule() {
    if (this.fetcherName && this.selectedDay && this.scheduleDate && this.scheduleTime) {
      console.log('Schedule saved with the following details:');
      console.log(`Fetcher: ${this.fetcherName}`);
      console.log(`Day: ${this.selectedDay}`);
      console.log(`Date: ${this.scheduleDate}`);
      console.log(`Time: ${this.scheduleTime}`);
    } else {
      console.log('Please fill in all the fields.');
    }
  }
}
