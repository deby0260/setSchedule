import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';  // Import Router for navigation

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SchedulePage implements OnInit {

  constructor(private router: Router) { }  // Inject Router

  ngOnInit() {
  }

  openCalendar() {
    // Navigate to the inside-schedule page
    this.router.navigate(['/inside-schedule']);
  }
}
