// eslint-disable-next-line import/prefer-default-export
export function mergeSocialIdentity(origSocialIdentity: any = {}, newSocialIdentity: any = {}) {
  const mergedSocialIdentity = JSON.parse(JSON.stringify(origSocialIdentity));
  return Object
    .keys(newSocialIdentity)
    .reduce((socialIdentity, identity) => {
      socialIdentity[identity] = Object.assign({}, origSocialIdentity[identity], newSocialIdentity[identity]);
      return socialIdentity;
    }, mergedSocialIdentity);
}
