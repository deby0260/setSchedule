import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Firestore imports
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

interface FamilyMember {
  name: string;        // child name
  gradeLevel: string;  // grade level
}

@Component({
  selector: 'app-create-family',
  templateUrl: './create-family.page.html',
  styleUrls: ['./create-family.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class CreateFamilyPage {
  familyName: string = '';
  members: FamilyMember[] = [];
  photoUrl: string | null = null;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private firestore: Firestore
  ) {}

  async addMember() {
    const alert = await this.alertCtrl.create({
      header: 'Add Child',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: "Child's Name"
        },
        {
          name: 'gradeLevel',
          type: 'text',
          placeholder: 'Grade Level (e.g., Kinder, Grade 1)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.name && data.gradeLevel) {
              this.members.push({
                name: data.name,
                gradeLevel: data.gradeLevel
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  removeMember(index: number) {
    if (this.members.length > 0) {
      this.members.splice(index, 1);
    }
  }

  uploadPhoto() {
    alert('Upload photo clicked!');
  }

  // Save each child as a document in the listofFamilies collection
  async finishEditing() {
    if (!this.familyName.trim()) {
      this.showToast('Please enter a family name.');
      return;
    }
    if (this.members.length === 0) {
      this.showToast('Please add at least one child.');
      return;
    }
    try {
      const famCol = collection(this.firestore, 'listofFamilies');
      // Save each child as a document
      for (const member of this.members) {
        await addDoc(famCol, {
          FamilyName: this.familyName,
          childName: member.name,
          gradeLevel: member.gradeLevel
        });
      }
      this.showToast('Family saved!');
      this.router.navigate(['/family']);
    } catch (err) {
      console.error(err);
      this.showToast('Error saving family.');
    }
  }

  cancelEditing() {
    this.router.navigate(['/family']);
  }

  goHome() { this.router.navigate(['/home']); }
  goToFamily() { this.router.navigate(['/family']); }
  goToDocuments() { this.router.navigate(['/pickup-log']); }
  goToSettings() { this.router.navigate(['/settings']); }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: 'primary'
    });
    toast.present();
  }
}
