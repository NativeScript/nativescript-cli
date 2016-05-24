This repository uses [travis-ci](https://travis-ci.org/axemclion/indexeddbshim) for running the continuous integration (CI) tests. It uses [saucelabs](http://saucelabs.com) to run automated test cases on different browsers. The saucelabs server can be only accessed using a secure environment variable that is not accessible in pull requests.

Thank you for submitting a patch to this project, we really appreciate it. 
Here is a quick overview of the process used to ensure that pull requests do not break existing functionality.

1. Send a pull request with your changes to `master` branch
2. Travis runs jslint, creates ./dist files and executes the tests in ./test on your pull request. The Travis CI Build must succeed. Please correct any errors.
3. Your pull request is merged into `master` at the discretion on the project collaborators. 