import Promise from 'bluebird';

const BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BLOB_TYPE_PREFIX = '~~kinvey_type~';
const BLOB_TYPE_PREFIX_REGEX = /^~~kinvey_type~([^~]+)~/;
const SERIALIZED_MARKER = '__ksc__:';
const SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

// OMG the serializations!
const TYPE_ARRAYBUFFER = 'arbf';
const TYPE_BLOB = 'blob';
const TYPE_INT8ARRAY = 'si08';
const TYPE_UINT8ARRAY = 'ui08';
const TYPE_UINT8CLAMPEDARRAY = 'uic8';
const TYPE_INT16ARRAY = 'si16';
const TYPE_INT32ARRAY = 'si32';
const TYPE_UINT16ARRAY = 'ur16';
const TYPE_UINT32ARRAY = 'ui32';
const TYPE_FLOAT32ARRAY = 'fl32';
const TYPE_FLOAT64ARRAY = 'fl64';
const TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

export default class Serializer {
  serialize(value) {
    const promise = new Promise(function(resolve, reject) {
      let valueString = '';

      if (value) {
        valueString = value.toString();
      }

      // Cannot use `value instanceof ArrayBuffer` or such here, as these
      // checks fail when running the tests using casper.js...
      //
      // TODO: See why those tests fail and use a better solution.
      if (value && (value.toString() === '[object ArrayBuffer]' ||
              value.buffer &&
              value.buffer.toString() === '[object ArrayBuffer]')) {
        // Convert binary arrays to a string and prefix the string with
        // a special marker.
        let buffer;
        let marker = SERIALIZED_MARKER;

        if (value instanceof ArrayBuffer) {
          buffer = value;
          marker += TYPE_ARRAYBUFFER;
        } else {
          buffer = value.buffer;

          if (valueString === '[object Int8Array]') {
            marker += TYPE_INT8ARRAY;
          } else if (valueString === '[object Uint8Array]') {
            marker += TYPE_UINT8ARRAY;
          } else if (valueString === '[object Uint8ClampedArray]') {
            marker += TYPE_UINT8CLAMPEDARRAY;
          } else if (valueString === '[object Int16Array]') {
            marker += TYPE_INT16ARRAY;
          } else if (valueString === '[object Uint16Array]') {
            marker += TYPE_UINT16ARRAY;
          } else if (valueString === '[object Int32Array]') {
            marker += TYPE_INT32ARRAY;
          } else if (valueString === '[object Uint32Array]') {
            marker += TYPE_UINT32ARRAY;
          } else if (valueString === '[object Float32Array]') {
            marker += TYPE_FLOAT32ARRAY;
          } else if (valueString === '[object Float64Array]') {
            marker += TYPE_FLOAT64ARRAY;
          } else {
            reject(new Error('Failed to get type for BinaryArray'));
          }
        }

        resolve(marker + this.bufferToString(buffer));
      } else if (valueString === '[object Blob]') {
        // Conver the blob to a binaryArray and then to a string.
        const fileReader = new FileReader();

        fileReader.onload = function() {
          // Backwards-compatible prefix for the blob type.
          const str = BLOB_TYPE_PREFIX + value.type + '~' + this.bufferToString(this.result);
          resolve(SERIALIZED_MARKER + TYPE_BLOB + str);
        };

        fileReader.readAsArrayBuffer(value);
      } else {
        try {
          resolve(JSON.stringify(value));
        } catch (err) {
          // TODO console.error("Couldn't convert value into a JSON string: ", value);
          reject(err);
        }
      }
    });

    return promise;
  }

  deserialize(value) {
    const promise = new Promise(function(resolve, reject) {
      // If we haven't marked this string as being specially serialized (i.e.
      // something other than serialized JSON), we can just return it and be
      // done with it.
      if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
        resolve(JSON.parse(value));
      }

      // The following code deals with deserializing some kind of Blob or
      // TypedArray. First we separate out the type of data we're dealing
      // with from the data itself.
      let serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
      const type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
      let blobType;

      // Backwards-compatible blob type serialization strategy.
      // DBs created with older versions of localForage will simply not have the blob type.
      if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
        const matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
        blobType = matcher[1];
        serializedString = serializedString.substring(matcher[0].length);
      }

      const buffer = this.stringToBuffer(serializedString);

      // Return the right type based on the code/type set during
      // serialization.
      switch (type) {
      case TYPE_ARRAYBUFFER:
        return resolve(buffer);
      case TYPE_BLOB:
        return resolve(this._createBlob([buffer], {type: blobType}));
      case TYPE_INT8ARRAY:
        return resolve(new Int8Array(buffer));
      case TYPE_UINT8ARRAY:
        return resolve(new Uint8Array(buffer));
      case TYPE_UINT8CLAMPEDARRAY:
        return resolve(new Uint8ClampedArray(buffer));
      case TYPE_INT16ARRAY:
        return resolve(new Int16Array(buffer));
      case TYPE_UINT16ARRAY:
        return resolve(new Uint16Array(buffer));
      case TYPE_INT32ARRAY:
        return resolve(new Int32Array(buffer));
      case TYPE_UINT32ARRAY:
        return resolve(new Uint32Array(buffer));
      case TYPE_FLOAT32ARRAY:
        return resolve(new Float32Array(buffer));
      case TYPE_FLOAT64ARRAY:
        return resolve(new Float64Array(buffer));
      default:
        return reject(new Error('Unkown type: ' + type));
      }
    });

    return promise;
  }

  stringToBuffer(serializedString) {
    // Fill the string into a ArrayBuffer.
    let bufferLength = serializedString.length * 0.75;
    const len = serializedString.length;
    let i;
    let p = 0;
    let encoded1;
    let encoded2;
    let encoded3;
    let encoded4;

    if (serializedString[serializedString.length - 1] === '=') {
      bufferLength--;

      if (serializedString[serializedString.length - 2] === '=') {
        bufferLength--;
      }
    }

    const buffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(buffer);

    for (i = 0; i < len; i += 4) {
      encoded1 = BASE_CHARS.indexOf(serializedString[i]);
      encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
      encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
      encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return buffer;
  }

  bufferToString(buffer) {
    // base64-arraybuffer
    const bytes = new Uint8Array(buffer);
    let base64String = '';

    for (let i = 0, len = bytes.length; i < len; i += 3) {
      base64String += BASE_CHARS[bytes[i] >> 2];
      base64String += BASE_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64String += BASE_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64String += BASE_CHARS[bytes[i + 2] & 63];
    }

    if ((bytes.length % 3) === 2) {
      base64String = base64String.substring(0, base64String.length - 1) + '=';
    } else if (bytes.length % 3 === 1) {
      base64String = base64String.substring(0, base64String.length - 2) + '==';
    }

    return base64String;
  }

  _createBlob(parts, properties) {
    parts = parts || [];
    properties = properties || {};

    try {
      return new Blob(parts, properties);
    } catch (err) {
      if (err.name !== 'TypeError') {
        throw err;
      }

      const BlobBuilder = global.BlobBuilder ||
                          global.MSBlobBuilder ||
                          global.MozBlobBuilder ||
                          global.WebKitBlobBuilder;
      const builder = new BlobBuilder();

      for (let i = 0, len = parts.length; i < len; i += 1) {
        builder.append(parts[i]);
      }

      return builder.getBlob(properties.type);
    }
  }
}
