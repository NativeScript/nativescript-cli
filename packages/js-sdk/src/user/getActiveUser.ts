import { getSession } from '../http';
import { User } from './user';

export function getActiveUser() {
  const session = getSession();

  if (session) {
    return new User(session);
  }

  return null;
}
