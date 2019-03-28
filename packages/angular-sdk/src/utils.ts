import { InjectionToken } from '@angular/core';
import { HTML5KinveyConfig } from 'kinvey-html5-sdk/lib/init';

export const KinveyConfigToken = new InjectionToken<HTML5KinveyConfig>('kinvey.config');
