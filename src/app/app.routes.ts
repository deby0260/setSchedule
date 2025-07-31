import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'homecreen',
    loadComponent: () => import('./homecreen/homecreen.page').then((m) => m.HomecreenPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'schedule',
    loadComponent: () => import('./schedule/schedule.page').then((m) => m.SchedulePage),
  },
  {
    path: 'inside-schedule',
    loadComponent: () => import('./inside-schedule/inside-schedule.page').then((m) => m.InsideSchedulePage),
  },
  {
    path: 'view-schedule',
    loadComponent: () => import('./view-schedule/view-schedule.page').then( m => m.ViewSchedulePage)
  },
  {
    path: 'digital-consent',
    loadComponent: () => import('./digital-consent/digital-consent.page').then( m => m.DigitalConsentPage)
  },
  {
    path: 'show-consent-letter',
    loadComponent: () => import('./show-consent-letter/show-consent-letter.page').then( m => m.ShowConsentLetterPage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then( m => m.NotificationsPage)
  },
  {
    path: 'pickup-log',
    loadComponent: () => import('./pickup-log/pickup-log.page').then( m => m.PickupLogPage)
  },
  {
    path: 'family',
    loadComponent: () => import('./family/family.page').then( m => m.FamilyPage)
  },
  {
    path: 'qr-code',
    loadComponent: () => import('./qr-code/qr-code.page').then( m => m.QrCodePage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
  path: 'create-family',
  loadComponent: () => import('./create-family/create-family.page').then(m => m.CreateFamilyPage)
},
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
    {
    path: 'family-list',
    loadComponent: () => import('./family-list/family-list.page').then(m => m.FamilyListPage)
  },

];
