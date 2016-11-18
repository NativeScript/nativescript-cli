import Kinvey from 'kinvey-html5-sdk';
import Push from './push';

// Add Push module to Kinvey
Kinvey.Push = Push;

// Export
module.exports = Kinvey;
