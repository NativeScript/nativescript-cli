import { TestBed } from '@angular/core/testing';

import { KinveyAngularSdkService } from './kinvey-angular-sdk.service';

describe('KinveyAngularSdkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KinveyAngularSdkService = TestBed.get(KinveyAngularSdkService);
    expect(service).toBeTruthy();
  });
});
