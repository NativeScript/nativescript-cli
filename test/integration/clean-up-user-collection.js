const request = require('request');

const cleanUpUserCollection = (config) => {

  // Set the headers
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${config.appKey}:${config.masterSecret}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'X-Kinvey-Delete-Entire-Collection': true,
    'X-Kinvey-Retain-collection-Metadata': true
  }

  const body = { collectionName: 'user' };

  /// Configure the request
  const options = {
    url: `https://baas.kinvey.com/rpc/${config.appKey}/remove-collection`,
    method: 'POST',
    headers: headers,
    json: true,
    body: body
  }

  // Start the request
  return new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (!error && response.statusCode == 200) {
        resolve();
      }
      else {
        reject('User collection cleanup failed!');
      }
    });
  });
};


module.exports = cleanUpUserCollection;
