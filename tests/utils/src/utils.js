import assert from 'assert';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

export function randomNumber(max = 100) {
  return Math.floor(Math.random() * Math.floor(max));
}

export function arraysEqual(a, b) {
  function _arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    const aClone = a.slice(0, a.length);
    aClone.sort();

    const bClone = a.slice(0, b.length);
    bClone.sort();

    for (let i = 0, len = aClone.length; i < len; i += 1) {
      if (aClone[i] !== bClone[i]) return false;
    }

    return true;
  }

  if (!_arraysEqual(a, b)) {
    throw new assert.AssertionError({
      message: 'The arrays are not equal'
    });
  }

  return true;
}
