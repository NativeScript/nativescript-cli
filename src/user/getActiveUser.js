import { get as getSession } from '../session';
import User from './user';

export default function getActiveUser() {
  const session = getSession();

  if (session) {
    return new User(session);
  }

  return null;
}
