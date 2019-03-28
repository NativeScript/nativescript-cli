import { Popup } from './popup';

export function open(url: string) {
  const popup = new Popup();
  return popup.open(url);
}
