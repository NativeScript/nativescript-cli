function isNode() {
  return typeof module !== 'undefined' && module.exports;
}

function isPhoneGap() {
  return typeof global.cordova !== 'undefined';
}

function isTitanium() {
  return typeof Titanium !== 'undefined';
}

module.exports = {
  isNode: isNode,
  isPhoneGap: isPhoneGap,
  isTitanium: isTitanium
};
