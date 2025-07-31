import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

// Interfaces for type safety
export interface Schedule {
  id?: string;
  fetcher: string;
  day: string;
  date: string;
  time: string;
  fullDate: string;
  childName?: string;
  pickupPerson?: string;
  pickupTime?: string;
  pickupDate?: string;
  location?: string;
  notes?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsentLetter {
  id?: string;
  parentName: string;
  childName: string;
  authorizedPersons: string[];
  emergencyContact: string;
  emergencyPhone: string;
  specialInstructions: string;
  parentSignature?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  // ✅ Register a new user (now supports userName)
  async registerUser(userData: {
    fullName: string;
    userName: string;
    email: string;
    contactNumber: string;
    image: string;
    passWord: string;
  }): Promise<string> {
    try {
      const regCol = collection(this.firestore, 'register');
      const docRef = await addDoc(regCol, userData);
      console.log('New user registered with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error('Error registering user');
    }
  }

  // Add a family member with unique document ID
  async createFamilyMember(data: {
    memberName: string;
    role: string;
    phoneNumber: string;
    email: string;
  }): Promise<string> {
    try {
      const memberRef = collection(this.firestore, 'addMember');
      const docRef = await addDoc(memberRef, data);
      console.log('New member added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding member to Firestore:', error);
      throw new Error('Error adding member to Firestore');
    }
  }

  // Get all family members
  async getFamilyMembers(): Promise<any[]> {
    try {
      const memberRef = collection(this.firestore, 'addMember');
      const membersSnap = await firstValueFrom(collectionData(memberRef, { idField: 'id' }));
      return membersSnap || [];
    } catch (error) {
      console.error('Error getting family members from Firestore:', error);
      return [];
    }
  }

  // Delete a family member
  async deleteFamilyMember(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, `addMember/${id}`);
      await deleteDoc(docRef);
      console.log('Family member deleted with ID:', id);
    } catch (error) {
      console.error('Error deleting family member from Firestore:', error);
      throw new Error('Error deleting family member from Firestore');
    }
  }

  // Update a family member
  async updateFamilyMember(id: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.firestore, `addMember/${id}`);
      await updateDoc(docRef, data);
      console.log('Family member updated with ID:', id);
    } catch (error) {
      console.error('Error updating family member in Firestore:', error);
      throw new Error('Error updating family member in Firestore');
    }
  }

  // Get single family member by ID
  async getMemberById(id: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, `addMember/${id}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      console.error('Error getting family member by ID from Firestore:', error);
      return null;
    }
  }

  // Schedule-related methods
  async createSchedule(data: Omit<Schedule, 'id' | 'createdAt'>): Promise<string> {
    try {
      const scheduleRef = collection(this.firestore, 'schedules');
      const scheduleData = {
        ...data,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(scheduleRef, scheduleData);
      console.log('New schedule added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding schedule to Firestore:', error);
      throw new Error('Error adding schedule to Firestore');
    }
  }

  async getSchedulesByStatus(status: string): Promise<any[]> {
    try {
      const scheduleRef = collection(this.firestore, 'schedules');
      const schedulesSnap = await firstValueFrom(collectionData(scheduleRef, { idField: 'id' }));
      return (schedulesSnap || []).filter((schedule: any) => schedule.status === status);
    } catch (error) {
      console.error('Error getting schedules by status from Firestore:', error);
      return [];
    }
  }

  // Consent letter methods
  async createConsentLetter(data: Omit<ConsentLetter, 'id' | 'createdAt'>): Promise<string> {
    try {
      const consentRef = collection(this.firestore, 'consentLetters');
      const consentData = {
        ...data,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(consentRef, consentData);
      console.log('New consent letter added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding consent letter to Firestore:', error);
      throw new Error('Error adding consent letter to Firestore');
    }
  }

  async getConsentLetters(): Promise<any[]> {
    try {
      const consentRef = collection(this.firestore, 'consentLetters');
      const consentsSnap = await firstValueFrom(collectionData(consentRef, { idField: 'id' }));
      return consentsSnap || [];
    } catch (error) {
      console.error('Error getting consent letters from Firestore:', error);
      return [];
    }
  }

  // Utility method for timestamp conversion
  timestampToDate(timestamp: string): Date {
    return new Date(timestamp);
  }
}
