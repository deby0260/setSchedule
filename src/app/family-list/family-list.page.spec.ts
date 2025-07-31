import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FamilyListPage } from './family-list.page';

describe('FamilyListPage', () => {
  let component: FamilyListPage;
  let fixture: ComponentFixture<FamilyListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FamilyListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
