/* eslint-env mocha */

import { expect } from 'chai';
import { spy, stub } from 'sinon';
import { Popup } from '../../../src/angular2/popup';

describe('Angular2:Popup', () => {
  describe('open()', () => {
    it('should throw an error if the popup was blocked', () => {
      stub(global, 'open').callsFake(() => null);
      expect(() => Popup.open('http://kinvey.com')).to.throw(Error, 'blocked');
      global.open.restore();
    });

    it('should emit load event with popup url', (done) => {
      const popup = Popup.open('http://kinvey.com');
      const loadSpy = spy((event) => {
        try {
          expect(event).to.have.property('url');
          popup.close();
          done();
        } catch (e) {
          done(e);
        }
      });
      popup.on('load', loadSpy);
    });

    it('should emit loadstart event with popup url', (done) => {
      const popup = Popup.open('http://kinvey.com');
      const loadstartSpy = spy((event) => {
        try {
          expect(event).to.have.property('url');
          popup.close();
          done();
        } catch (e) {
          done(e);
        }
      });
      popup.on('loadstart', loadstartSpy);
    });

    it('should emit error event if an error occurs');

    it('should emit exit event when popup is closed', (done) => {
      const popup = Popup.open('http://kinvey.com');
      const exitSpy = spy(() => {
        try {
          expect(exitSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      });
      popup.on('exit', exitSpy);
      popup.close();
    });
  });

  describe('close()', () => {
    it('should close the popup', (done) => {
      const popup = Popup.open('http://kinvey.com');
      const exitSpy = spy(() => {
        try {
          expect(exitSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      });
      popup.on('exit', exitSpy);
      popup.close();
    });
  });
});
