import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'homecreen.page.html',
  styleUrls: ['homecreen.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonIcon],
})
export class HomecreenPage {
  constructor(private router: Router) {
    addIcons({ shieldCheckmark });
  }

  // Navigate to schedule page when anywhere on the page is clicked
  goToSchedule() {
    this.router.navigate(['/login']);
  }
}
