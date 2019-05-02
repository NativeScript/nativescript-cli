export function mergeSocialIdentity(origSocialIdentity = {}, newSocialIdentity = {}) {
  const _origSocialIdentity = JSON.parse(JSON.stringify(origSocialIdentity));
  const _newSocialIdentity = JSON.parse(JSON.stringify(newSocialIdentity));
  const result = Object.keys(_newSocialIdentity).reduce((socialIdentity, identity) => {
    socialIdentity[identity] = Object.assign(_newSocialIdentity[identity], _origSocialIdentity[identity]);
    return socialIdentity;
  }, _newSocialIdentity);
  return result;
}
