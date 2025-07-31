import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class RegisterPage {
  registerForm: FormGroup;
  profilePhoto: File | null = null;
  photoPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private firebaseService: FirebaseService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      userName: ['', [Validators.required, Validators.minLength(4)]], // Added userName
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      passWord: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.matchPasswords() });
  }

  matchPasswords(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as FormGroup;
      const password = group.get('passWord')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return password === confirm ? null : { notSame: true };
    };
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.profilePhoto = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.photoPreviewUrl = reader.result as string;
      reader.readAsDataURL(this.profilePhoto);
    }
  }

  async register() {
    if (this.registerForm.invalid) {
      await this.showToast('Please complete all fields correctly.', 'danger');
      return;
    }

    let imageUrl = '';
    if (this.profilePhoto) {
      const storage = getStorage();
      const photoRef = ref(storage, `profile_images/${Date.now()}_${this.profilePhoto.name}`);
      await uploadBytes(photoRef, this.profilePhoto);
      imageUrl = await getDownloadURL(photoRef);
    } else {
      imageUrl = 'https://firebasestorage.googleapis.com/v0/b/fetchsafe.appspot.com/o/default-avatar.png?alt=media';
    }

    const formValue = this.registerForm.value;
    const userData = {
      fullName: formValue.fullName,
      userName: formValue.userName, // Added userName
      email: formValue.email,
      contactNumber: formValue.contactNumber,
      image: imageUrl,
      passWord: formValue.passWord
    };

    try {
      await this.firebaseService.registerUser(userData);
      await this.showSuccessAlertAndNavigate();
    } catch (err) {
      console.error(err);
      await this.showToast('Error registering. Try again.', 'danger');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async showSuccessAlertAndNavigate() {
    const alert = await this.alertCtrl.create({
      header: 'Success',
      message: 'Registration successful! Your data has been saved.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }]
    });
    await alert.present();
  }
}
