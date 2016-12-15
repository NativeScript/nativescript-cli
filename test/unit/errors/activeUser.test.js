import { ActiveUserError, BaseError } from '../../../src/errors';
import expect from 'expect';

describe('ActiveUserError', () => {
  describe('constructor', function() {
    it('should be an instance of ActiveUserError', () => {
      const error = new ActiveUserError();
      expect(error instanceof ActiveUserError).toEqual(true);
    });

    it('should be an instance of BaseError', () => {
      const error = new ActiveUserError();
      expect(error instanceof BaseError).toEqual(true);
    });

    it('should be an instance of Error', () => {
      const error = new ActiveUserError();
      expect(error instanceof Error).toEqual(true);
    });
  });

  describe('name', () => {
    it('should return ActiveUserError', () => {
      const error = new ActiveUserError();
      expect(error.name).toEqual('ActiveUserError');
    });
  });

  describe('message', () => {
    it('should return the default message \'An active user already exists.\'', () => {
      const error = new ActiveUserError();
      expect(error.message).toEqual('An active user already exists.');
    });

    it('should return the custom message \'An active user already exists. Please logout with Kinvey.User.logout.\'', () => {
      const error = new ActiveUserError('An active user already exists. Please logout with Kinvey.User.logout.');
      expect(error.message).toEqual('An active user already exists. Please logout with Kinvey.User.logout.');
    });
  });

  describe('debug', () => {
    it('should return the default debug message \'\'', () => {
      const error = new ActiveUserError();
      expect(error.debug).toEqual('');
    });

    it('should return the custom debug message \'Please logout with Kinvey.User.logout.\'', () => {
      const error = new ActiveUserError(undefined, 'Please logout with Kinvey.User.logout.');
      expect(error.debug).toEqual('Please logout with Kinvey.User.logout.');
    });
  });

  describe('code', () => {
    it('should return the default code -1', () => {
      const error = new ActiveUserError();
      expect(error.code).toEqual(-1);
    });

    it('should return the custom code 309', () => {
      const error = new ActiveUserError(undefined, undefined, 309);
      expect(error.code).toEqual(309);
    });
  });

  describe('kinveyRequestId', () => {
    it('should return undefined', () => {
      const error = new ActiveUserError();
      expect(error.kinveyRequestId).toEqual(undefined);
    });
  });
});
