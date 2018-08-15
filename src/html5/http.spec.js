import expect from 'expect';
import { deviceInformation } from './http';

describe('HTML5 Http', () => {
  describe('deviceInformation()', () => {
    it('should contain the package name', () => {
      const pkg = { name: 'kinvey-html5-sdk' };
      const deviceInfo = deviceInformation(pkg);
      expect(deviceInfo).toInclude(pkg.name);
    });
  });
});
