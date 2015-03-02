## Release Procedures

A release typically consists of the following steps:

1. Run ```grunt deploy``` in *js-library-dev*.
1. Run the browser tests.
1. Copy the software artifacts in *dist/publish/* to the *js-library* repo.
1. Copy the software artifacts in *dist/publish/* to the S3 bucket.
1. Update the node module (see [Updating the node module](#updating-the-node-module)).
1. Update the devcenter changelog.
1. Create a new release on GitHub for *js-library*.

### Updating the node module[](#updating-the-node-module)

To update the node module, perform the following steps:

1. Clone the [Git repository](https://github.com/Kinvey/kinvey-nodejs).
1. Replace *kinvey.js* with the *kinvey-nodejs-x.y.z.js* generated in step 3 of the build process. Rename the file to *kinvey.js*, and make sure the endpoint points to production.
1. Update *package.json* with the new version number.
1. Commit your changes.
1. Tag the new version (*x.y.z*).
1. Push to origin. Make sure the tag is pushed too.
1. Publish the module by running: *npm publish*. Ask Morgan or Mark if you don’t have permission to do so.
