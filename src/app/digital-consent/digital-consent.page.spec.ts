import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitalConsentPage } from './digital-consent.page';

describe('DigitalConsentPage', () => {
  let component: DigitalConsentPage;
  let fixture: ComponentFixture<DigitalConsentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitalConsentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
