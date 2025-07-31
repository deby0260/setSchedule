import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PickupLogPage } from './pickup-log.page';

describe('PickupLogPage', () => {
  let component: PickupLogPage;
  let fixture: ComponentFixture<PickupLogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PickupLogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
