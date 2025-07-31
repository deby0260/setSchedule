import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService, ConsentLetter } from '../services/firebase.service';

@Component({
  selector: 'app-digital-consent',
  templateUrl: './digital-consent.page.html',
  styleUrls: ['./digital-consent.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DigitalConsentPage implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;

  // Form fields for Firebase
  parentName: string = '';
  childName: string = '';
  authorizedPersons: string[] = [''];
  emergencyContact: string = '';
  emergencyPhone: string = '';
  specialInstructions: string = '';

  // Legacy fields (keeping for backward compatibility)
  letterContent: string = '';
  isEmergencyFetcher: boolean = false;
  isOneTimeFetcher: boolean = false;
  hasSignature: boolean = false;

  // Loading state
  isLoading: boolean = false;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // Small delay to ensure the view is fully rendered
    setTimeout(() => {
      this.setupCanvas();
    }, 100);
  }

  ionViewDidEnter() {
    // Refresh canvas when entering the page
    if (this.canvas) {
      this.setupCanvas();
    }
  }

  // Setup signature canvas
  setupCanvas() {
    this.canvas = this.signatureCanvas.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Set canvas size to match the container
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Set white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set drawing properties for better visibility
    this.ctx.strokeStyle = '#000000'; // Pure black
    this.ctx.lineWidth = 2; // Good line width
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalCompositeOperation = 'source-over';

    // Add event listeners
    this.addCanvasEventListeners();
  }

  // Add event listeners for drawing
  addCanvasEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  // Start drawing
  startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  // Draw on canvas
  draw(e: MouseEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
    this.hasSignature = true;
  }

  // Stop drawing
  stopDrawing() {
    this.isDrawing = false;
  }

  // Handle touch events
  handleTouch(e: TouchEvent) {
    e.preventDefault();

    if (e.type === 'touchstart' && e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.startDrawing(mouseEvent);
    } else if (e.type === 'touchmove' && e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.draw(mouseEvent);
    } else if (e.type === 'touchend') {
      this.stopDrawing();
    }
  }

  // Open signature pad (for mobile optimization)
  openSignaturePad() {
    // Focus on canvas for better mobile experience
    this.canvas.focus();
  }

  // Clear signature
  clearSignature(event: Event) {
    event.stopPropagation();

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Reset white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Reset drawing properties
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;

    this.hasSignature = false;
  }

  // Add authorized person
  addAuthorizedPerson() {
    this.authorizedPersons.push('');
  }

  // Remove authorized person
  removeAuthorizedPerson(index: number) {
    if (this.authorizedPersons.length > 1) {
      this.authorizedPersons.splice(index, 1);
    }
  }

  // Check if form is valid
  isFormValid(): boolean {
    return !!(
      this.parentName.trim() &&
      this.childName.trim() &&
      this.authorizedPersons.some(person => person.trim()) &&
      this.emergencyContact.trim() &&
      this.emergencyPhone.trim() &&
      this.hasSignature
    );
  }

  // Save consent to Firebase
  async saveConsent() {
    if (this.isFormValid() && !this.isLoading) {
      this.isLoading = true;

      try {
        // Filter out empty authorized persons
        const filteredAuthorizedPersons = this.authorizedPersons.filter(person => person.trim());

        const consentData: Omit<ConsentLetter, 'id' | 'createdAt' | 'updatedAt'> = {
          parentName: this.parentName.trim(),
          childName: this.childName.trim(),
          parentSignature: this.canvas.toDataURL(),
          authorizedPersons: filteredAuthorizedPersons,
          emergencyContact: this.emergencyContact.trim(),
          emergencyPhone: this.emergencyPhone.trim(),
          specialInstructions: this.specialInstructions.trim()
        };

        // Save to Firebase
        const consentId = await this.firebaseService.createConsentLetter(consentData);

        // Also save signature and legacy data to localStorage for backward compatibility
        const legacyData = {
          id: consentId,
          letter: this.letterContent,
          signature: this.canvas.toDataURL(),
          isEmergencyFetcher: this.isEmergencyFetcher,
          isOneTimeFetcher: this.isOneTimeFetcher,
          createdAt: new Date().toISOString(),
          firebaseId: consentId
        };

        const existingConsents = this.getStoredConsents();
        existingConsents.push(legacyData);
        localStorage.setItem('digitalConsents', JSON.stringify(existingConsents));

        console.log('Consent saved to Firebase with ID:', consentId);
        alert('Consent letter saved successfully!');

        // Navigate back
        this.goBack();
      } catch (error) {
        console.error('Error saving consent:', error);
        alert('Error saving consent letter. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getStoredConsents(): any[] {
    const stored = localStorage.getItem('digitalConsents');
    return stored ? JSON.parse(stored) : [];
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/schedule']); // or wherever you want to go back to
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
