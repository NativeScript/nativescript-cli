import { Errors } from 'kinvey-js-sdk';

export async function open(url: string): Promise<any> {
  throw new Errors.KinveyError('NodeJS does not support the opening of popups.');
}
