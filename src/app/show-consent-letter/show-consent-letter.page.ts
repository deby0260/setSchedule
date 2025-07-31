import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService, ConsentLetter } from '../services/firebase.service';

interface ConsentData {
  id: string;
  letter: string;
  signature: string;
  isEmergencyFetcher: boolean;
  isOneTimeFetcher: boolean;
  createdAt: string;
  // Firebase fields (optional for backward compatibility)
  parentName?: string;
  childName?: string;
  authorizedPersons?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  specialInstructions?: string;
}

@Component({
  selector: 'app-show-consent-letter',
  templateUrl: './show-consent-letter.page.html',
  styleUrls: ['./show-consent-letter.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ShowConsentLetterPage implements OnInit {

  consentData: ConsentData | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.loadConsentData();
  }

  ionViewWillEnter() {
    // Refresh data when entering the page
    this.loadConsentData();
  }

  // Load the most recent consent data from Firebase and localStorage
  async loadConsentData() {
    try {
      // Load from Firebase first
      const firebaseConsents = await this.firebaseService.getConsentLetters();

      if (firebaseConsents.length > 0) {
        // Get the most recent consent from Firebase
        const latestFirebaseConsent = firebaseConsents[0]; // Already sorted by createdAt desc

        // Convert to legacy format for display compatibility
        this.consentData = {
          id: latestFirebaseConsent.id || '',
          letter: latestFirebaseConsent.specialInstructions || '',
          signature: '', // Firebase doesn't store signature, will load from localStorage
          isEmergencyFetcher: latestFirebaseConsent.authorizedPersons.length > 0,
          isOneTimeFetcher: false,
          createdAt: this.firebaseService.timestampToDate(latestFirebaseConsent.createdAt).toISOString(),
          // Add Firebase-specific data
          parentName: latestFirebaseConsent.parentName,
          childName: latestFirebaseConsent.childName,
          authorizedPersons: latestFirebaseConsent.authorizedPersons,
          emergencyContact: latestFirebaseConsent.emergencyContact,
          emergencyPhone: latestFirebaseConsent.emergencyPhone,
          specialInstructions: latestFirebaseConsent.specialInstructions
        };

        console.log('Loaded consent data from Firebase:', this.consentData);
        return;
      }
    } catch (error) {
      console.error('Error loading consent data from Firebase:', error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('digitalConsents');

    if (stored) {
      try {
        const consents: ConsentData[] = JSON.parse(stored);

        if (consents.length > 0) {
          // Get the most recent consent (last in array)
          this.consentData = consents[consents.length - 1];
          console.log('Loaded consent data from localStorage (fallback):', this.consentData);
        } else {
          this.consentData = null;
        }
      } catch (error) {
        console.error('Error parsing local consent data:', error);
        this.consentData = null;
      }
    } else {
      this.consentData = null;
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Get valid until date (example: today only)
  getValidUntilDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' Only';
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

  createConsent() {
    this.router.navigate(['/digital-consent']);
  }
}
