'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * @private
 * Enum for Social Identities
 */
var SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  Kinvey: process && process.env && process.env.KINVEY_IDENTITY || 'kinvey' || 'kinvey',
  LinkedIn: 'linkedin',
  MobileIdentityConnect: process && process.env && process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth' || 'kinveyAuth',
  Windows: 'windows'
};
Object.freeze(SocialIdentity);
exports.SocialIdentity = SocialIdentity;