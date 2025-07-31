import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { collection, query, where, getDocs } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage {
  loginForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastCtrl: ToastController,
    private firestore: Firestore
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async login() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      // Query Firestore for username in the "register" collection
      const usersRef = collection(this.firestore, 'register');
      const q = query(usersRef, where('userName', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await this.showToast('User not registered yet.', 'danger');
        return;
      }

      let loginSuccess = false;
      let loggedInName = '';
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData['passWord'] === password) {
          loginSuccess = true;
          loggedInName = userData['userName']; // Always store username!
        }
      });

      if (loginSuccess) {
        localStorage.setItem('fetchsafeUser', loggedInName); // Save to localStorage

        await this.showToast('Login successful!', 'success');
        this.router.navigate(['/schedule']); // Redirect to schedule/home
      } else {
        await this.showToast('Invalid credentials!', 'danger');
      }

    } else {
      await this.showToast('Please enter username and password.', 'warning');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  register() {
    this.goToRegister();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
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
}
