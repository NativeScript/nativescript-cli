export function isBrowser() {
  const platform = !!global.device ? global.device.platform : undefined;
  return platform === 'browser' || !platform;
}

export function isiOS() {
  const platform = !!global.device ? global.device.platform : undefined;
  return platform === 'iOS';
}

export function isAndroid() {
  const platform = !!global.device ? global.device.platform : undefined;
  return platform === 'Android';
}
