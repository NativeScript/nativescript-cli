/**
 * @private
 */
export async function open() {
  throw new Error('You must override the default http function.');
}

/**
 * @private
 */
export async function close() {
  throw new Error('You must override the default http function.');
}
