import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowConsentLetterPage } from './show-consent-letter.page';

describe('ShowConsentLetterPage', () => {
  let component: ShowConsentLetterPage;
  let fixture: ComponentFixture<ShowConsentLetterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowConsentLetterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
