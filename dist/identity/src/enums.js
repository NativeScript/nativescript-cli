'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  Kinvey: process && process.env && process.env.KINVEY_IDENTITY || undefined || 'kinvey',
  LinkedIn: 'linkedin',
  MobileIdentityConnect: process && process.env && process.env.KINVEY_MIC_IDENTITY || undefined || 'kinveyAuth',
  Windows: 'windows'
};
Object.freeze(SocialIdentity);
exports.SocialIdentity = SocialIdentity;