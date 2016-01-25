export function isNode() {
  return typeof module !== 'undefined' && module.exports;
}

export function isPhoneGap() {
  return typeof global.cordova !== 'undefined';
}

export function isTitanium() {
  return typeof Titanium !== 'undefined';
}
