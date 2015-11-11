test init
===========

Usage | Synopsis
------|-------
General | `$ tns test init [--framework <Framework>]`

Configures your project for unit testing with a selected framework. This operation installs the nativescript-unit-test-runner npm module and its dependencies and creates a `tests` folder in the `app` directory.

### Options
* `--framework <Framework>` - Sets the unit testing framework to install. The following frameworks are available: <%= formatListOfNames(constants.TESTING_FRAMEWORKS, 'and') %>.

<% if(isHtml) { %>
### Command Limitations

* You can configure only one unit testing framework per project.

### Related Commands
Command | Description
--------|------------
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators. 
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>