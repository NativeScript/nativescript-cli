import { uuidv4 } from './utils';

let id;

// eslint-disable-next-line import/prefer-default-export
export default function get() {
  if (!id) {
    id = uuidv4();
  }
  return id;
}

