const request = require('request');

const cleanUpCollection = (config, collectionName) => {

  // Set the headers
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${config.appKey}:${config.masterSecret}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'X-Kinvey-Delete-Entire-Collection': true,
    'X-Kinvey-Retain-collection-Metadata': true
  }

  const body = { collectionName: collectionName };

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
      // for _blob if there are no files, the clean up request returns 404
      if ((!error && response.statusCode == 200) || response.statusCode === 404) {
        resolve();
      }
      else {
        reject(`${collectionName} collection cleanup failed!`);
      }
    });
  });
};


module.exports = cleanUpCollection;
