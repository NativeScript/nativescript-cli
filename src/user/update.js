import getActiveUser from './getActiveUser';

export default async function update(data) {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.update(data);
  }

  return null;
}
