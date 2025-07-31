import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'Schedule' | 'Request' | 'Pickup' | 'Success';
  message: string;
  timestamp: string;
  isRead: boolean;
  scheduleId?: string;
  fetcher?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.loadNotifications();
    this.initializeSampleNotifications();
  }

  // Load notifications from localStorage
  private loadNotifications() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        this.notificationsSubject.next(notifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }

  // Save notifications to localStorage
  private saveNotifications(notifications: Notification[]) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    this.notificationsSubject.next(notifications);
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.saveNotifications(updatedNotifications);
  }

  // Add schedule creation notification
  addScheduleCreatedNotification(fetcher: string, date: string, time: string, scheduleId: string): void {
    this.addNotification({
      type: 'Schedule',
      message: `Schedule created for ${fetcher} on ${date} at ${time}`,
      isRead: false,
      scheduleId,
      fetcher
    });
  }

  // Add pickup notification
  addPickupNotification(fetcher: string, time: string, scheduleId: string): void {
    this.addNotification({
      type: 'Pickup',
      message: `Picked up schedule for ${fetcher} at ${time}`,
      isRead: false,
      scheduleId,
      fetcher
    });
  }

  // Add success notification
  addSuccessNotification(fetcher: string, time: string, scheduleId: string): void {
    this.addNotification({
      type: 'Success',
      message: `Picked up ${fetcher} successfully at ${time}`,
      isRead: false,
      scheduleId,
      fetcher
    });
  }

  // Add request notification
  addRequestNotification(requesterName: string): void {
    this.addNotification({
      type: 'Request',
      message: `${requesterName} Request to Join in your Group`,
      isRead: false
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    this.saveNotifications(updatedNotifications);
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.isRead).length;
  }

  // Clear all notifications
  clearAll(): void {
    this.saveNotifications([]);
  }

  // Initialize sample notifications for demo
  private initializeSampleNotifications(): void {
    const stored = localStorage.getItem('notifications');
    if (!stored || JSON.parse(stored).length === 0) {
      const now = new Date();
      const today = new Date(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const older = new Date(now);
      older.setDate(older.getDate() - 3);

      const sampleNotifications: Notification[] = [
        {
          id: 'sample1',
          type: 'Schedule',
          message: 'Picked up Schedule for Dave at 3:00PM',
          timestamp: today.toISOString(),
          isRead: false,
          fetcher: 'Daveryle Enerez'
        },
        {
          id: 'sample2',
          type: 'Schedule',
          message: 'Picked up Dave successfully at 3:00PM',
          timestamp: yesterday.toISOString(),
          isRead: true,
          fetcher: 'Daveryle Enerez'
        },
        {
          id: 'sample3',
          type: 'Request',
          message: 'Adrae Request to Join in your Group',
          timestamp: yesterday.toISOString(),
          isRead: true,
          fetcher: 'Daveryle Enerez'
        },
        {
          id: 'sample4',
          type: 'Schedule',
          message: 'Picked up Schedule for Dave at 3:00PM',
          timestamp: yesterday.toISOString(),
          isRead: false,
          fetcher: 'Daveryle Enerez'
        },
        {
          id: 'sample5',
          type: 'Request',
          message: 'Adrae Request to Join in your Group',
          timestamp: older.toISOString(),
          isRead: true,
          fetcher: 'Daveryle Enerez'
        },
        {
          id: 'sample6',
          type: 'Schedule',
          message: 'Picked up Schedule for Dave at 3:00PM',
          timestamp: older.toISOString(),
          isRead: false,
          fetcher: 'Daveryle Enerez'
        }
      ];

      this.saveNotifications(sampleNotifications);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
