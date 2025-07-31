import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomecreenPage } from './homecreen.page';

describe('HomecreenPage', () => {
  let component: HomecreenPage;
  let fixture: ComponentFixture<HomecreenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomecreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
