export function isDefined(obj) {
  return (obj !== undefined && obj !== null);
}

export function nested(doc, property, value) {
  if (!property) {
    doc = typeof value === 'undefined' ? doc : value;
    return doc;
  }

  let obj = doc;
  let parts = property.split('.');
  let current;

  // Traverse the document until the nested property is located.
  while ((current = parts.shift()) && isDefined(obj) && obj.hasOwnProperty(current)) {
    if (parts.length === 0) {
      obj[current] = typeof value === 'undefined' ? obj[current] : value;
      return obj[current];
    }

    obj = obj[current];
  }

  return null;
}
