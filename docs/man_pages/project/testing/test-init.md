test init
===========

Usage | Synopsis
------|-------
General | `$ tns test init [--framework <Framework>]`

Adds support for unit testing in an existing project.

### Options
* `--framework <Framework>` - Specify the unit testing framework to install. Available frameworks are <%= formatListOfNames(constants.TESTING_FRAMEWORKS, 'and') %>.

<% if(isHtml) { %>
### Related commands
Command | Description
--------|------------
[test](test.html) | Run tests
<% } %>