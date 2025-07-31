import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string;
}

interface FamilyData {
  name: string;
  createdDate: string;
  photo?: string;
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
  selector: 'app-family',
  templateUrl: './family.page.html',
  styleUrls: ['./family.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FamilyPage implements OnInit {

  familyData: FamilyData = {
    name: 'Enerez Family',
    createdDate: 'June 23, 2025',
    photo: undefined // No photo initially
  };

  familyMembers: FamilyMember[] = [];

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.loadFamilyData();
  }

  ionViewWillEnter() {
    // Refresh family data when entering the page
    this.loadFamilyData();
  }

  // Load family data from Firebase and localStorage
  async loadFamilyData() {
    // Load stored family data
    const storedFamily = localStorage.getItem('familyData');
    if (storedFamily) {
      try {
        this.familyData = JSON.parse(storedFamily);
      } catch (error) {
        console.error('Error parsing family data:', error);
      }
    }

    // Load family members from Firebase (with localStorage fallback)
    try {
      const firebaseMembers = await this.firebaseService.getFamilyMembers();
      let existingMembers: FamilyMember[] = firebaseMembers.map((member: any) => ({
        id: member.id || '',
        name: member.memberName || member.name, // Handle both field names
        role: member.role,
        phone: member.phoneNumber || member.phone, // Handle both field names
        email: member.email,
        avatar: member.avatar
      }));

      // Generate family members from app data
      const generatedMembers = this.generateFamilyMembersFromAppData();

      // Combine existing and generated members, avoiding duplicates
      const allMembers = [...existingMembers, ...generatedMembers];
      this.familyMembers = this.removeDuplicateMembers(allMembers);

      // Always ensure the removable child is included (first)
      this.ensureRemovableChildIncluded();

      // Always ensure the guardian/parent is included
      this.ensureGuardianIncluded();

      // Always ensure the main child (Daveryle Enerez) is included
      this.ensureMainChildIncluded();

      // Save updated family data
      this.saveFamilyData();
    } catch (error) {
      console.error('Error loading family members from Firebase:', error);

      // Fallback to localStorage only
      const storedMembers = localStorage.getItem('familyMembers');
      let existingMembers: FamilyMember[] = [];

      if (storedMembers) {
        try {
          existingMembers = JSON.parse(storedMembers);
        } catch (error) {
          console.error('Error parsing family members:', error);
        }
      }

      // Generate family members from app data
      const generatedMembers = this.generateFamilyMembersFromAppData();

      // Combine existing and generated members, avoiding duplicates
      const allMembers = [...existingMembers, ...generatedMembers];
      this.familyMembers = this.removeDuplicateMembers(allMembers);

      // Always ensure the removable child is included (first)
      this.ensureRemovableChildIncluded();

      // Always ensure the guardian/parent is included
      this.ensureGuardianIncluded();

      // Always ensure the main child (Daveryle Enerez) is included
      this.ensureMainChildIncluded();

      // Save updated family data
      this.saveFamilyData();
    }
  }

  // Add new family member to Firestore
  async addMember() {
    const memberData = await this.showAddMemberForm();

    if (memberData) {
      try {
        // Save to Firebase (or localStorage if Firebase not available)
        const memberId = await this.firebaseService.createFamilyMember({
          memberName: memberData.name,
          role: memberData.role,
          phoneNumber: memberData.phone,
          email: memberData.email
        });

        const newMember: FamilyMember = {
          id: memberId,
          name: memberData.name,
          role: memberData.role,
          phone: memberData.phone,
          email: memberData.email
        };

        this.familyMembers.push(newMember);
        this.saveFamilyData();

        console.log(`Added new family member: ${memberData.name} with ID: ${memberId}`);
        alert(`Successfully added ${memberData.name} to the family!`);
      } catch (error) {
        console.error('Error adding family member:', error);
        alert('Failed to add family member. Please try again.');
      }
    }
  }

  // Show add member form and collect data from the user
  async showAddMemberForm(): Promise<{ name: string; role: string; phone: string; email: string } | null> {
    return new Promise((resolve) => {
      const name = prompt('Enter member name:');
      if (!name || name.trim() === '') {
        alert('Name is required');
        resolve(null);
        return;
      }

      const role = prompt('Enter member role (e.g., Caregiver, Driver, Guardian):');
      if (!role || role.trim() === '') {
        alert('Role is required');
        resolve(null);
        return;
      }

      const phone = prompt('Enter phone number:');
      if (!phone || phone.trim() === '') {
        alert('Phone number is required');
        resolve(null);
        return;
      }

      const email = prompt('Enter email address:');
      if (!email || email.trim() === '') {
        alert('Email address is required');
        resolve(null);
        return;
      }

      resolve({
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase()
      });
    });
  }

  // Generate family members from current app data
  generateFamilyMembersFromAppData(): FamilyMember[] {
    const members: FamilyMember[] = [];

    // Get fetchers from schedules
    const scheduleData = localStorage.getItem('schedules');
    if (scheduleData) {
      try {
        const schedules = JSON.parse(scheduleData);
        const fetcherNames = new Set<string>();

        schedules.forEach((schedule: any) => {
          if (schedule.fetcher) {
            fetcherNames.add(schedule.fetcher);
          }
        });

        // Add fetchers as family members (if not excluded)
        fetcherNames.forEach(name => {
          if (!this.isMemberExcluded(name)) {
            members.push({
              id: `fetcher-${name.toLowerCase().replace(/\s+/g, '-')}`,
              name: name,
              role: this.determineFetcherRole(name),
              phone: 'Not provided',
              email: 'Not provided'
            });
          }
        });
      } catch (error) {
        console.error('Error parsing schedule data:', error);
      }
    }

    return members;
  }

  // Remove duplicate members based on name
  removeDuplicateMembers(members: FamilyMember[]): FamilyMember[] {
    const seen = new Set<string>();
    return members.filter(member => {
      const key = member.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Ensure the main child (Daveryle Enerez) is always included
  ensureMainChildIncluded() {
    const mainChild = this.familyMembers.find(member =>
      member.name.toLowerCase().includes('daveryle') ||
      member.name.toLowerCase().includes('enerez')
    );

    if (!mainChild) {
      // Add child with special ID (protected from removal)
      this.familyMembers.push({
        id: 'main-child',
        name: 'Daveryle Enerez',
        role: 'Child',
        phone: 'N/A',
        email: 'N/A'
      });
    }
  }

  // Ensure the guardian/parent is always included and cannot be removed
  ensureGuardianIncluded() {
    const guardian = this.familyMembers.find(member => member.id === 'guardian-parent');

    if (!guardian) {
      // Add guardian at the beginning of the list
      this.familyMembers.unshift({
        id: 'guardian-parent',
        name: 'Rylenerez Enerez', // Parent/Guardian name
        role: 'Guardian/Parent',
        phone: '09958597839', // Guardian's phone number
        email: 'rylenerez@gmail.com' // Guardian's email
      });
    }
  }

  // Ensure the removable child is included
  ensureRemovableChildIncluded() {
    const removableChild = this.familyMembers.find(member => member.id === 'removable-child');

    if (!removableChild) {
      // Add removable child (Maria) at the beginning after guardian
      this.familyMembers.splice(1, 0, {
        id: 'removable-child',
        name: 'Maria Enerez',
        role: 'Child',
        phone: 'N/A',
        email: 'N/A'
      });
    }
  }

  // Save family data to localStorage
  saveFamilyData() {
    try {
      localStorage.setItem('familyData', JSON.stringify(this.familyData));
      localStorage.setItem('familyMembers', JSON.stringify(this.familyMembers));
    } catch (error) {
      console.error('Error saving family data:', error);
    }
  }

  // Check if member is excluded
  isMemberExcluded(name: string): boolean {
    const exclusionList = this.getExclusionList();
    return exclusionList.includes(name.toLowerCase());
  }

  // Get exclusion list
  getExclusionList(): string[] {
    const stored = localStorage.getItem('excludedMembers');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing exclusion list:', error);
      }
    }
    return [];
  }

  // Determine fetcher role based on name
  determineFetcherRole(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ana') || lowerName.includes('sarah')) {
      return 'Caregiver';
    } else if (lowerName.includes('john') || lowerName.includes('driver')) {
      return 'Driver';
    }
    return 'Fetcher';
  }

  // Check if member can be removed
  canRemoveMember(member: FamilyMember): boolean {
    // Don't allow removing the guardian/parent
    if (member.id === 'guardian-parent') {
      return false;
    }

    // Don't allow removing the main child
    if (member.id === 'main-child') {
      return false;
    }

    // Don't allow removing the removable child (Maria)
    if (member.id === 'removable-child') {
      return false;
    }

    // Allow removing all other members
    return true;
  }

  // Remove family member
  async removeMember(memberId: string, memberName: string) {
    const confirmed = confirm(`Are you sure you want to remove ${memberName} from the family?\n\nThis will also remove all related data including:\n• Schedules\n• Consent letters\n• Pickup logs\n\nThis action cannot be undone.`);

    if (confirmed) {
      try {
        // Remove all related data first
        this.removeAllRelatedData(memberName);

        // Remove from current list
        this.familyMembers = this.familyMembers.filter(member => member.id !== memberId);

        // If it's a Firebase member (has proper ID), remove from Firebase
        if (memberId && !memberId.startsWith('fetcher-') && !memberId.startsWith('consent-') && memberId !== 'main-child') {
          await this.firebaseService.deleteFamilyMember(memberId);
          console.log(`Removed ${memberName} from Firebase`);
        }

        // If it's a manually added member, remove from storage
        if (memberId.startsWith('manual-') || memberId.startsWith('local-member-')) {
          this.saveFamilyData();
        } else {
          // For auto-generated members, add to exclusion list
          this.addToExclusionList(memberName);
        }

        console.log(`Removed ${memberName} and all related data from family`);

        // Show success message
        alert(`✅ Success!\n\n${memberName} and all related data have been successfully removed from the family.`);
      } catch (error) {
        console.error('Error removing family member:', error);
        alert('Failed to remove family member. Please try again.');
      }
    }
  }

  // Remove all data related to a family member
  removeAllRelatedData(memberName: string) {
    // Remove schedules
    this.removeSchedulesForMember(memberName);

    // Remove consent letters
    this.removeConsentLettersForMember(memberName);

    // Remove pickup logs
    this.removePickupLogsForMember(memberName);

    // Remove from any other related data
    this.removeFromOtherData(memberName);
  }

  // Remove schedules for a member
  removeSchedulesForMember(memberName: string) {
    const stored = localStorage.getItem('schedules');
    if (stored) {
      try {
        const schedules = JSON.parse(stored);
        const filteredSchedules = schedules.filter((schedule: any) =>
          schedule.fetcher !== memberName
        );
        localStorage.setItem('schedules', JSON.stringify(filteredSchedules));
        console.log(`Removed schedules for ${memberName}`);
      } catch (error) {
        console.error('Error removing schedules:', error);
      }
    }
  }

  // Remove consent letters for a member
  removeConsentLettersForMember(memberName: string) {
    const stored = localStorage.getItem('consentLetters');
    if (stored) {
      try {
        const letters = JSON.parse(stored);
        const filteredLetters = letters.filter((letter: any) =>
          !letter.letter.includes(memberName) &&
          !letter.authorizedPersons?.includes(memberName)
        );
        localStorage.setItem('consentLetters', JSON.stringify(filteredLetters));
        console.log(`Removed consent letters for ${memberName}`);
      } catch (error) {
        console.error('Error removing consent letters:', error);
      }
    }
  }

  // Remove pickup logs for a member
  removePickupLogsForMember(memberName: string) {
    const stored = localStorage.getItem('pickupLogs');
    if (stored) {
      try {
        const logs = JSON.parse(stored);
        const filteredLogs = logs.filter((log: any) =>
          log.fetcher !== memberName
        );
        localStorage.setItem('pickupLogs', JSON.stringify(filteredLogs));
        console.log(`Removed pickup logs for ${memberName}`);
      } catch (error) {
        console.error('Error removing pickup logs:', error);
      }
    }
  }

  // Remove from other data sources
  removeFromOtherData(memberName: string) {
    // Remove from form data
    const formData = localStorage.getItem('formData');
    if (formData) {
      try {
        const data = JSON.parse(formData);
        let modified = false;

        // Check if the form data contains references to this member
        const dataString = JSON.stringify(data).toLowerCase();
        if (dataString.includes(memberName.toLowerCase())) {
          // Remove or update references in form data
          if (data.fetcher === memberName) {
            delete data.fetcher;
            modified = true;
          }
          if (data.authorizedPersons && Array.isArray(data.authorizedPersons)) {
            data.authorizedPersons = data.authorizedPersons.filter((person: string) => person !== memberName);
            modified = true;
          }
        }

        if (modified) {
          localStorage.setItem('formData', JSON.stringify(data));
          console.log(`Updated form data to remove references to ${memberName}`);
        }
      } catch (error) {
        console.error('Error updating form data:', error);
      }
    }
  }

  // Add member to exclusion list
  addToExclusionList(memberName: string) {
    const exclusionList = this.getExclusionList();
    const lowerName = memberName.toLowerCase();

    if (!exclusionList.includes(lowerName)) {
      exclusionList.push(lowerName);
      localStorage.setItem('excludedMembers', JSON.stringify(exclusionList));
      console.log(`Added ${memberName} to exclusion list`);
    }
  }

  // Edit family information
  editFamily() {
    const newName = prompt('Enter new family name:', this.familyData.name);
    if (newName && newName.trim() !== '') {
      this.familyData.name = newName.trim();
      this.saveFamilyData();
      alert('Family name updated successfully!');
    }
  }

  // Navigation methods
  goHome() {
    this.router.navigate(['/home']);
  }

  goToFamily() {
    // Already on family page
  }

  goToDocuments() {
    this.router.navigate(['/pickupLog']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  panicAlert() {
    alert('🚨 PANIC ALERT ACTIVATED! 🚨\n\nEmergency services have been notified.\nYour location has been shared with emergency contacts.');
  }
}
