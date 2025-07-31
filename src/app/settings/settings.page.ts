import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {

  // Settings data
  settings = {
    appNotifications: true,
    smsNotifications: false,
    darkMode: false
  };

  currentLanguage = 'English';

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadSettings();
  }

  // Load settings from localStorage
  loadSettings() {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Load language preference
    const storedLanguage = localStorage.getItem('appLanguage');
    if (storedLanguage) {
      this.currentLanguage = storedLanguage;
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('appSettings', JSON.stringify(this.settings));
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Handle setting changes
  onSettingChange(settingKey: string, event: any) {
    const value = event.detail.checked;
    (this.settings as any)[settingKey] = value;
    this.saveSettings();

    // Apply dark mode immediately
    if (settingKey === 'darkMode') {
      this.applyDarkMode(value);
    }

    console.log(`${settingKey} changed to:`, value);
  }

  // Apply dark mode
  applyDarkMode(enabled: boolean) {
    document.body.classList.toggle('dark', enabled);

    // In a real app, you might want to use Ionic's built-in dark mode
    // document.documentElement.classList.toggle('ion-palette-dark', enabled);
  }

  // Change language
  changeLanguage() {
    console.log('Change language clicked');

    // Show language selection options
    const languages = ['English', 'Filipino', 'Cebuano'];
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;

    this.currentLanguage = languages[nextIndex];
    localStorage.setItem('appLanguage', this.currentLanguage);

    console.log('Language changed to:', this.currentLanguage);
  }

  // Edit profile
  editProfile() {
    console.log('Edit Profile clicked');
    // Navigate to profile edit page
    // this.router.navigate(['/edit-profile']);
  }

  // Edit privacy profile
  editPrivacyProfile() {
    console.log('Edit Privacy Profile clicked');
    // Navigate to privacy profile edit page
    // this.router.navigate(['/privacy-profile']);
  }

  // Change password
  changePassword() {
    console.log('Change Password clicked');
    // Navigate to change password page
    // this.router.navigate(['/change-password']);
  }

  // Firebase test
  goToFirebaseTest() {
    console.log('Firebase Test clicked');
    this.router.navigate(['/firebase-test']);
  }

  // Navigation methods
  goHome() {
    this.router.navigate(['/schedule']);
  }

  goToFamily() {
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
    console.log('Already on settings page');
  }

  panicAlert() {
    console.log('Panic button clicked!');
    // Add panic alert functionality here
    alert('Emergency alert activated! Contacting emergency contacts...');
  }
}
