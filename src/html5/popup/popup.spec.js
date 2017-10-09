import { URL } from 'url';
import { expect, use } from 'chai';
import { spy, stub } from 'sinon';
import { Popup } from './popup';

class Window {
  constructor(url = 'http://test.com') {
    this.location = new URL(url);
    this._closed = false;
  }

  get closed() {
    return this._closed;
  }

  open(url) {
    return new Window(url);
  }

  close() {
    this._closed = true;
  }
}
Window.prototype.setInterval = setInterval;
Window.prototype.clearInterval = clearInterval;

describe('HTML5:Popup', () => {
  before(() => {
    const window = new Window();
    global.open = window.open;
    global.setInterval = window.setInterval;
    global.clearInterval = window.clearInterval;
  });

  after(() => {
    delete global.open;
    delete global.setInterval;
    delete global.clearInterval;
  });

  describe('open()', () => {
    it('should throw an error if the popup was blocked', () => {
      stub(global, 'open').callsFake(() => null);
      expect(() => Popup.open('http://test.com')).to.throw(Error, 'blocked');
      global.open.restore();
    });

    it('should emit load event with popup url', (done) => {
      const popup = Popup.open('http://test.com');
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
      const popup = Popup.open('http://test.com');
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
      const popup = Popup.open('http://test.com');
      const exitSpy = spy(() => {
        try {
          expect(exitSpy.calledOnce).to.be.true;
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
      const popup = Popup.open('http://test.com');
      const exitSpy = spy(() => {
        try {
          expect(exitSpy.calledOnce).to.be.true;
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
