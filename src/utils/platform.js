export function isPhoneGap() {
  return typeof global.cordova !== 'undefined';
}

export function isTitanium() {
  return typeof Titanium !== 'undefined';
}
