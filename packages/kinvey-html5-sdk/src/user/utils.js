"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeSocialIdentity = mergeSocialIdentity;

// eslint-disable-next-line import/prefer-default-export
function mergeSocialIdentity() {
  var origSocialIdentity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var newSocialIdentity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var mergedSocialIdentity = JSON.parse(JSON.stringify(origSocialIdentity));
  return Object.keys(newSocialIdentity).reduce(function (socialIdentity, identity) {
    socialIdentity[identity] = Object.assign({}, origSocialIdentity[identity], newSocialIdentity[identity]);
    return socialIdentity;
  }, mergedSocialIdentity);
}