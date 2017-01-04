import pkg from '../../../package.json';

export function deviceInformation() {
  const platform = process.title;
  const version = process.version;
  const manufacturer = process.platform;

  // Return the device information string.
  const parts = [`js-${pkg.name}/${pkg.version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}
