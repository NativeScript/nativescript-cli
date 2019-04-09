import { KinveyError } from 'kinvey-js-sdk';

export async function open(url: string): Promise<any> {
  throw new KinveyError('NodeJS does not support the opening of popups.');
}
