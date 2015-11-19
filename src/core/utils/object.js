function nested(document, dotProperty, value) {
  if (!dotProperty) {// Top-level document.
    document = typeof value === 'undefined' ? document : value;
    return document;
  }

  let obj = document;
  const parts = dotProperty.split('.');

  // Traverse the document until the nested property is located.
  let current = parts.shift();
  while (current && obj && obj.hasOwnProperty(current)) {
    if (parts.length === 0) {// Return the (new) property value.
      obj[current] = typeof value === 'undefined' ? obj[current] : value;
      return obj[current];
    }

    obj = obj[current];// Continue traversing.
    current = parts.shift();
  }

  return null;// Property not found.
}

function isDefined(obj) {
  return obj !== undefined && obj !== null;
}

module.exports = {
  nested: nested,
  isDefined: isDefined
};
