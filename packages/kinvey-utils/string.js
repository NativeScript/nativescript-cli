/**
 * @private
 */
function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

/**
 * @private
 */
exports.randomString = function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

exports.isNonemptyString = function isNonemptyString(obj) {
  return (typeof obj === 'string') && obj !== '';
}

exports.uuidv4 = function uuidv4() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
