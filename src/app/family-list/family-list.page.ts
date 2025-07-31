import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-family-list',
  templateUrl: './family-list.page.html',
  styleUrls: ['./family-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FamilyListPage implements OnInit {
  searchTerm: string = '';
  families: { name: string }[] = [];
  filteredFamilies: { name: string }[] = [];

  constructor(private router: Router, private firestore: Firestore) {}

  ngOnInit() {
    this.loadFamilies();
  }

  async loadFamilies() {
    const colRef = collection(this.firestore, 'listofFamilies');
    const snapshot = await getDocs(colRef);
    const familySet = new Set<string>();
    const familiesArr: { name: string }[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data['FamilyName']) {
        // Only push unique family names
        if (!familySet.has(data['FamilyName'])) {
          familySet.add(data['FamilyName']);
          familiesArr.push({ name: data['FamilyName'] });
        }
      }
    });
    this.families = familiesArr;
    this.filteredFamilies = [...this.families];
  }

  searchFamily(event: any) {
    const val = this.searchTerm?.toLowerCase() || '';
    this.filteredFamilies = this.families.filter(fam =>
      fam.name.toLowerCase().includes(val)
    );
  }

  createFamily() {
    this.router.navigate(['/create-family']);
  }

  goToNotifications() { this.router.navigate(['/notifications']); }
  goHome() { this.router.navigate(['/home']); }
  goToFamily() { this.router.navigate(['/family']); }
  goToDocuments() { this.router.navigate(['/pickup-log']); }
  goToSettings() { this.router.navigate(['/settings']); }
}
