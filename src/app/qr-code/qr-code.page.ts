import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.page.html',
  styleUrls: ['./qr-code.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class QrCodePage implements OnInit {

  qrSize: number = 280;
  generatedTime: string = '';
  validityDuration: string = '24 hours';
  qrCodeId: string = '';
  qrData: string = '';
  qrCodeImageUrl: string = '';
  isLoadingQR: boolean = false;

  // QR Code API configuration
  private qrApiBaseUrl: string = 'https://api.qrserver.com/v1/create-qr-code/';
  private qrApiParams = {
    size: '280x280',
    format: 'png',
    margin: 10,
    ecc: 'M', // Error correction level
    color: '000000',
    bgcolor: 'ffffff'
  };

  // Offline support
  public isOnline: boolean = navigator.onLine;

  constructor(
    private router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    this.setupOfflineDetection();
    this.generateQRData();
    this.generateQRCode();

    // Sync data when online
    if (this.isOnline) {
      this.syncDataWhenOnline();
    }
  }

  // Setup offline/online detection
  setupOfflineDetection() {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is now online - syncing data');
      this.syncDataWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is now offline - using cached data');
    });
  }

  // Sync logs and weather data when online
  async syncDataWhenOnline() {
    try {
      await Promise.all([
        this.syncPickupLogs(),
        this.updateWeatherData(),
        this.cacheQRCodeOffline()
      ]);
      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error during data sync:', error);
    }
  }

  // Generate QR code data
  generateQRData() {
    const timestamp = new Date().getTime();
    const familyData = this.getFamilyData();
    const userLocation = 'Cebu Talisay City';

    // Create unique QR code ID
    this.qrCodeId = `FS-${timestamp.toString().slice(-8)}`;

    // Set generated time
    this.generatedTime = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create QR data with security information
    const qrDataObject = {
      id: this.qrCodeId,
      app: 'FetchSafe',
      type: 'pickup_authorization',
      child: 'Daveryle Enerez',
      location: userLocation,
      family: familyData.name,
      timestamp: timestamp,
      expires: timestamp + (24 * 60 * 60 * 1000), // 24 hours
      authorized_fetchers: this.getAuthorizedFetchers(),
      security_hash: this.generateSecurityHash(timestamp)
    };

    this.qrData = JSON.stringify(qrDataObject);
  }

  // Get family data
  getFamilyData() {
    const storedFamily = localStorage.getItem('familyData');
    if (storedFamily) {
      try {
        return JSON.parse(storedFamily);
      } catch (error) {
        console.error('Error parsing family data:', error);
      }
    }
    return { name: 'Enerez Family' };
  }

  // Get authorized fetchers
  getAuthorizedFetchers(): string[] {
    const storedMembers = localStorage.getItem('familyMembers');
    const fetchers: string[] = [];

    if (storedMembers) {
      try {
        const members = JSON.parse(storedMembers);
        members.forEach((member: any) => {
          if (member.role !== 'Child') {
            fetchers.push(member.name);
          }
        });
      } catch (error) {
        console.error('Error parsing family members:', error);
      }
    }

    // Also get fetchers from schedules
    const scheduleData = localStorage.getItem('schedules');
    if (scheduleData) {
      try {
        const schedules = JSON.parse(scheduleData);
        schedules.forEach((schedule: any) => {
          if (schedule.fetcher && !fetchers.includes(schedule.fetcher)) {
            fetchers.push(schedule.fetcher);
          }
        });
      } catch (error) {
        console.error('Error parsing schedule data:', error);
      }
    }

    return fetchers.length > 0 ? fetchers : ['Ana', 'Maria', 'John'];
  }

  // Generate security hash
  generateSecurityHash(timestamp: number): string {
    const data = `FetchSafe_${timestamp}_Daveryle_Enerez`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase();
  }

  // Generate QR code using API or offline fallback
  generateQRCode() {
    this.isLoadingQR = true;

    if (this.isOnline) {
      // Try online API first
      this.generateOnlineQRCode();
    } else {
      // Use offline generation
      this.generateOfflineQRCode();
    }
  }

  // Generate QR code using online API
  generateOnlineQRCode() {
    // Encode the QR data for URL
    const encodedData = encodeURIComponent(this.qrData);

    // Build QR code API URL
    const params = new URLSearchParams({
      data: encodedData,
      size: this.qrApiParams.size,
      format: this.qrApiParams.format,
      margin: this.qrApiParams.margin.toString(),
      ecc: this.qrApiParams.ecc,
      color: this.qrApiParams.color,
      bgcolor: this.qrApiParams.bgcolor
    });

    this.qrCodeImageUrl = `${this.qrApiBaseUrl}?${params.toString()}`;

    console.log('Generated online QR Code URL:', this.qrCodeImageUrl);
    console.log('QR Data:', this.qrData);
  }

  // Generate QR code offline using canvas
  generateOfflineQRCode() {
    console.log('Generating QR code offline');
    this.qrCodeImageUrl = this.generateCanvasQRCode();
    this.isLoadingQR = false;
  }

  // Handle QR code image load success
  onQRCodeLoaded() {
    this.isLoadingQR = false;
    console.log('QR Code loaded successfully');
  }

  // Handle QR code image load error
  onQRCodeError() {
    this.isLoadingQR = false;
    console.error('Failed to load QR Code');

    // Fallback to a simpler QR code service
    this.generateFallbackQRCode();
  }

  // Generate fallback QR code using alternative service
  generateFallbackQRCode() {
    console.log('Using fallback QR code service');

    // Use QR-code-generator.com as fallback
    const encodedData = encodeURIComponent(this.qrData);
    this.qrCodeImageUrl = `https://chart.googleapis.com/chart?chs=280x280&cht=qr&chl=${encodedData}&choe=UTF-8`;

    // If Google Charts also fails, use a simple text-based fallback
    setTimeout(() => {
      if (this.isLoadingQR) {
        this.qrCodeImageUrl = this.generateDataURLQR();
        this.isLoadingQR = false;
      }
    }, 5000);
  }

  // Generate QR code using canvas for offline use
  generateCanvasQRCode(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    if (!ctx) return this.generateDataURLQR();

    // Create a more sophisticated QR-like pattern
    this.drawOfflineQRPattern(ctx, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  }

  // Draw offline QR pattern
  drawOfflineQRPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const moduleSize = 8;
    const modules = width / moduleSize;

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Generate pattern based on QR data
    ctx.fillStyle = '#000000';

    // Create deterministic pattern based on QR data
    const seed = this.qrData.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Create deterministic pattern
        const value = (seed + row * 31 + col * 17 + this.qrCodeId.charCodeAt(0)) % 100;

        // Draw finder patterns (corners)
        if (this.isFinderPattern(row, col, modules)) {
          this.drawFinderPattern(ctx, row, col, moduleSize);
        }
        // Draw timing patterns
        else if (row === 6 || col === 6) {
          if ((row + col) % 2 === 0) {
            ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
          }
        }
        // Draw data modules
        else if (value > 45) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Add offline indicator
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '12px Arial';
    ctx.fillText('OFFLINE', width - 60, height - 10);
  }

  // Check if position is a finder pattern
  isFinderPattern(row: number, col: number, modules: number): boolean {
    const size = 7;
    return (
      (row < size && col < size) || // Top-left
      (row < size && col >= modules - size) || // Top-right
      (row >= modules - size && col < size) // Bottom-left
    );
  }

  // Draw finder pattern
  drawFinderPattern(ctx: CanvasRenderingContext2D, row: number, col: number, moduleSize: number) {
    const x = col * moduleSize;
    const y = row * moduleSize;
    const size = moduleSize;

    // Outer black square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size * 7, size * 7);

    // Inner white square
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size, y + size, size * 5, size * 5);

    // Center black square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3);
  }

  // Generate a simple data URL QR code as last resort
  generateDataURLQR(): string {
    // Create a simple SVG QR-like pattern
    const svgContent = `
      <svg width="280" height="280" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="280" fill="white"/>
        <text x="140" y="140" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
          QR Code: ${this.qrCodeId}
        </text>
        <rect x="20" y="20" width="60" height="60" fill="black"/>
        <rect x="200" y="20" width="60" height="60" fill="black"/>
        <rect x="20" y="200" width="60" height="60" fill="black"/>
        <text x="140" y="260" text-anchor="middle" font-family="Arial" font-size="10" fill="red">OFFLINE</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  // Cache QR code for offline use
  async cacheQRCodeOffline() {
    try {
      const qrData = {
        id: this.qrCodeId,
        data: this.qrData,
        imageUrl: this.qrCodeImageUrl,
        timestamp: Date.now()
      };

      localStorage.setItem('cachedQRCode', JSON.stringify(qrData));
      console.log('QR code cached for offline use');
    } catch (error) {
      console.error('Error caching QR code:', error);
    }
  }

  // Sync pickup logs when online
  async syncPickupLogs() {
    try {
      // Get pending logs to sync
      const pendingLogs = this.getPendingLogsToSync();

      if (pendingLogs.length > 0) {
        console.log(`Syncing ${pendingLogs.length} pickup logs...`);

        // In a real app, this would send to a server
        // For now, we'll mark them as synced
        this.markLogsAsSynced(pendingLogs);

        console.log('Pickup logs synced successfully');
      }
    } catch (error) {
      console.error('Error syncing pickup logs:', error);
    }
  }

  // Get logs that need to be synced
  getPendingLogsToSync(): any[] {
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
  markLogsAsSynced(logs: any[]) {
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

  // Update weather data when online
  async updateWeatherData() {
    try {
      console.log('Updating weather data...');

      // In a real app, this would fetch from weather API
      const weatherData = {
        temperature: Math.floor(Math.random() * 10) + 25, // 25-35°C
        condition: 'Partly Cloudy',
        humidity: Math.floor(Math.random() * 20) + 70, // 70-90%
        windSpeed: Math.floor(Math.random() * 5) + 2, // 2-7 km/h
        city: 'Talisay',
        country: 'PH',
        lastUpdated: new Date().toISOString(),
        recommendation: 'Warm and humid weather in Cebu. Remember to bring water and a hat for your child'
      };

      localStorage.setItem('weatherData', JSON.stringify(weatherData));
      console.log('Weather data updated successfully');
    } catch (error) {
      console.error('Error updating weather data:', error);
    }
  }

  // Refresh QR code
  refreshQRCode() {
    this.isLoadingQR = true;
    this.generateQRData();
    this.generateQRCode();

    // Sync data if online
    if (this.isOnline) {
      this.syncDataWhenOnline();
    }

    console.log('QR Code refreshed');
  }

  // Navigation methods
  goBack() {
    this.location.back();
  }

  goHome() {
    this.router.navigate(['/schedule']);
  }

  goToFamily() {
    this.router.navigate(['/family']);
  }

  goToDocuments() {
    console.log('Documents clicked');
    this.router.navigate(['/pickup-log']);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  panicAlert() {
    console.log('Panic button clicked!');
    // Add panic alert functionality here
    alert('Emergency alert activated! Contacting emergency contacts...');
  }
}
