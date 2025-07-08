import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsideSchedulePage } from './inside-schedule.page';

describe('InsideSchedulePage', () => {
  let component: InsideSchedulePage;
  let fixture: ComponentFixture<InsideSchedulePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InsideSchedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
