const Popup = {
  open() {
    throw new Error('NodeJS does not support the opening of popups.');
  }
};

export default function open(url) {
  return Popup.open();
}
