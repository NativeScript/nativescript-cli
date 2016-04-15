export function isBrowser() {
  const platform = global.device.platform;
  return platform === 'browser';
}

export function isiOS() {
  const platform = global.device.platform;
  return platform === 'iOS';
}

export function isAndroid() {
  const platform = global.device.platform;
  return platform === 'Android';
}
