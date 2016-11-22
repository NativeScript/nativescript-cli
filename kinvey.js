import HTML5Kinvey from 'kinvey-html5-sdk';
import Device from './device';
import Popup from './popup';
import Push from './push';
import assign from 'lodash/assign';

class Kinvey extends HTML5Kinvey {
  static init(options = {}) {
    options = assign({
      deviceClass: Device,
      popupClass: Popup
    }, options);

    // Initialize Kinvey
    return super.init(options);
  }
}

// Add Push module
Kinvey.Push = Push;

// Export
export default Kinvey;
