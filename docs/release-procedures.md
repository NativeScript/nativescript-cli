## Release Procedures

Before doing a release, make sure the version number is incremented, and the changelog is up-to-date. Also update the public changelog.

A release typically consists of the following steps:

1. Run the *kinvey-js-library* job in Jenkins (targeting staging).
1. Run the browser tests.
1. Run the *kinvey-js-library* job in Jenkins (targeting production).
1. Copy the software artifacts in *dist/* to the *kinvey-downloads/js* S3 bucket.
1. Zip and copy the generated API Docs in docs/api/ to the kinvey-downloads/js S3 bucket (filename: kinvey-js-apidocs.zip).
1. Copy and commit the generated API Docs in *docs/api/* to *core-platform/docs/trunk/API/JS-API-Docs*.
1. Update and commit *core-platform/downloads/index.js*.
1. Run the *update-download-index* job in Jenkins.
1. Run the *docs-production* job in Jenkins.
1. Update the node module (see [Updating the node module](#updating-the-node-module)).
1. Update any depending projects (see [Updating depending projects](#updating-depending-projects)).
1. Tag the release in SVN.

### Updating the node module[](#updating-the-node-module)

To update the node module, perform the following steps:

1. Clone the [Git repository](https://github.com/Kinvey/kinvey-nodejs).
1. Replace *kinvey.js* with the *kinvey-nodejs-x.y.z.js* generated in step 3 of the build process. Rename the file to *kinvey.js*, and make sure the endpoint points to production.
1. Update *package.json* with the new version number.
1. Commit your changes.
1. Tag the new version (*x.y.z*).
1. Push to origin. Make sure the tag is pushed too.
1. Publish the module by running: *npm publish*. Ask Morgan or Mark if you don’t have permission to do so.

### Updating depending projects[](#updating-depending-projects)

The following projects on GitHub use the JavaScript Library:

*  [JS Tutorial](https://github.com/Kinvey/kinvey-js-tutorial)
*  [Demo apps](https://github.com/Kinvey/js-library-demo-apps)

For each project:

1. Update the project to use the new version (one project may have multiple occurrences to the version number).
1. If incompatible with the new version, make appropriate changes to the project.
1. Commit your changes.
1. Push to origin.
