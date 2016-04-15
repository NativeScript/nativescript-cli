const device = global.device || {};

export function isBrowser() {
  const platform = device.platform;
  return platform === 'browser' || !platform;
}

export function isiOS() {
  const platform = device.platform;
  return platform === 'iOS';
}

export function isAndroid() {
  const platform = device.platform;
  return platform === 'Android';
}
