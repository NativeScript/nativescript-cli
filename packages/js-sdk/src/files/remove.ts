import { KinveyError } from '../errors/kinvey';

export async function remove() {
  throw new KinveyError('Please use removeById() to remove files one by one.');
}
