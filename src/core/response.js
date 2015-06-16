import Rack from 'kinvey-rack';
import utils from './utils';

class Response extends Rack.Response {
  constructor(headers = {}, data = {}) {
    super();

    // Set request env
    this.addHeaders(headers);
    this.data = data;
  }

  getHeaders() {
    return utils.clone(this._headers);
  }

  getHeader(header) {
    let keys = Object.keys(this._headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this._headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    this._headers[header] = value;
  }

  addHeaders(headers) {
    let keys = Object.keys(headers);

    keys.forEach((header) => {
      let value = headers[header];
      this.setHeader(header, value);
    });
  }
}

export default Response;
