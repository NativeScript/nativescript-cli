import { InjectionToken } from '@angular/core';
import { KinveyConfig } from 'kinvey-nativescript-sdk';

export const KinveyConfigToken = new InjectionToken<KinveyConfig>('kinvey.config');
