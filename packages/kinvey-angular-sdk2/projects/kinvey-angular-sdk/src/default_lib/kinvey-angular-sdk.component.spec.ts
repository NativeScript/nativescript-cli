import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KinveyAngularSdkComponent } from './kinvey-angular-sdk.component';

describe('KinveyAngularSdkComponent', () => {
  let component: KinveyAngularSdkComponent;
  let fixture: ComponentFixture<KinveyAngularSdkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KinveyAngularSdkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KinveyAngularSdkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
