"use strict";

require("core-js/modules/es.object.define-property");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrongSetupAuthServiceId = exports.authServiceId = exports.fbPassword = exports.fbEmail = exports.deltaCollectionName = exports.collectionName = void 0;
var collectionName = 'Books';
exports.collectionName = collectionName;
var deltaCollectionName = 'BooksDelta';
exports.deltaCollectionName = deltaCollectionName;
var fbEmail = process.env.FACEBOOK_EMAIL;
exports.fbEmail = fbEmail;
var fbPassword = process.env.FACEBOOK_PASSWORD;
exports.fbPassword = fbPassword;
var authServiceId = 'af8e35a15aba4c369de921cc9d837e96';
exports.authServiceId = authServiceId;
var wrongSetupAuthServiceId = '82c61e6711e547e69ea5153cbe9bb854';
exports.wrongSetupAuthServiceId = wrongSetupAuthServiceId;