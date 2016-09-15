### Release
[Install Git-Extras](https://github.com/tj/git-extras/blob/master/Installation.md#mac-os-x-with-homebrew) before releasing the SDK.

1. Checkout the master branch.
2. Execute `git release <version>`. See [Version Management](#version-management) for more info on version.

### Version Management
Updating the SDK version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making an incompatible API changes.
* Minor (3.x.0): when adding functionality in a backwards-compatible manner.
* Patch (3.0.x): when making backwards-compatible bug fixes or enhancements.
