export function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    return value || obj;
  }

  const parts = dotProperty.split('.');
  let currentProperty = parts.shift();
  let currentObj = obj;

  while (currentProperty && typeof currentObj !== 'undefined') {
    currentObj = currentObj[currentProperty];
    currentProperty = parts.shift();
  }

  return typeof currentObj === 'undefined' ? value : currentObj;
}
