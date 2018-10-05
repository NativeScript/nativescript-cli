let popup = {
  open() {
    throw new Error('You must override the default popup.');
  }
};

export function register(customPopup) {
  if (customPopup) {
    popup = customPopup;
  }
}

export function open(url) {
  return popup.open(url);
}
