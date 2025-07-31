import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

interface Notification {
  id: string;
  type: 'Schedule' | 'Request' | 'Pickup' | 'Success';
  message: string;
  timestamp: string;
  isRead: boolean;
  scheduleId?: string;
  fetcher?: string;
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
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit {

  notifications: Notification[] = [];

  constructor(private router: Router, private notificationService: NotificationService) { }

  ngOnInit() {
    this.loadNotifications();
  }

  ionViewWillEnter() {
    // Refresh notifications when entering the page
    this.loadNotifications();
  }

  // Load notifications from the service
  loadNotifications() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }



  // Mark notification as read
  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
  }

  // Get appropriate icon for notification type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'Schedule':
        return 'calendar';
      case 'Pickup':
        return 'car';
      case 'Success':
        return 'checkmark-circle';
      case 'Request':
        return 'person-add';
      default:
        return 'notifications';
    }
  }

  // Format timestamp for display
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    }
  }

  // Get formatted date for log notifications
  getFormattedDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Get formatted time for log notifications
  getFormattedTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get today's notifications
  getTodayNotifications(): Notification[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.notifications.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate >= today && notificationDate < tomorrow;
    });
  }

  // Get yesterday's notifications
  getYesterdayNotifications(): Notification[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.notifications.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate >= yesterday && notificationDate < today;
    });
  }

  // Get older notifications
  getOlderNotifications(): Notification[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return this.notifications.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate < yesterday;
    });
  }

  // Navigation
  goBack() {
    this.router.navigate(['/schedule']);
  }

  goHome() {
    this.router.navigate(['/schedule']);
  }

  goToFamily() {
    this.router.navigate(['/family']);
  }

  goToDocuments() {
    this.router.navigate(['/pickup-log']);
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
