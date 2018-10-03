/**
 * @private
 */
let popup = {
  open() {
    throw new Error('You must override the default popup.');
  }
};

/**
 * @private
 */
export function use(customPopup) {
  popup = customPopup;
}

export function open(url) {
  return popup.open(url);
}
