import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface FamilyMember {
  name: string;
  role: string;
}

@Component({
  selector: 'app-create-family',
  templateUrl: './create-family.page.html',
  styleUrls: ['./create-family.page.scss'],
  standalone: true
})
export class CreateFamilyPage {
  familyName: string = '';
  members: FamilyMember[] = [
    { name: '', role: '' },
    { name: '', role: '' }
  ];
  photoUrl: string | null = null;

  constructor(private router: Router) {}

  addMember() {
    this.members.push({ name: '', role: '' });
  }

  removeMember(index: number) {
    if (this.members.length > 1) {
      this.members.splice(index, 1);
    }
  }

  uploadPhoto() {
    // Placeholder for image upload logic
    alert('Upload photo clicked!');
  }

  finishEditing() {
    // Placeholder for saving logic
    alert('Family saved!');
    this.router.navigate(['/family']);
  }

  cancelEditing() {
    this.router.navigate(['/family']);
  }

  goHome() { this.router.navigate(['/home']); }
  goToFamily() { this.router.navigate(['/family']); }
  goToDocuments() { this.router.navigate(['/pickup-log']); }
  goToSettings() { this.router.navigate(['/settings']); }
}
