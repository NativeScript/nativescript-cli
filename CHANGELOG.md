## Changelog
### 3.0.0-beta.16 (2016-04-19)
* Bugfix: Fixed missing url when opening popup for MIC login.

### 3.0.0-beta.15 (2016-04-19)
* Bugfix (MLIBZ-1029): Fixed a bug in the NetworkStore that would send remove calls as a GET request.
* Bugfix (MLIBZ-1030): Fixed the pull response for a data store to not be undefined.

#### 3.0.0-beta.13 (2016-04-04)
* Enhancement: Optimize delta fetch when no documents exist in cache.
* Bugfix: Fixed typos that caused crashes.

#### 3.0.0-beta.12 (2016-03-29)
* Enhancement: Refactored Popup and Device class to allow adapters.
* Enhancement: Removed platform specific code.

#### 3.0.0-beta.11 (2016-03-25)
* Bugfix: Replaced `global.Titanium` references with `Titanium`.

#### 3.0.0-beta.9 (2016-03-25)
* Bugfix (MLIBZ-946): Automically refresh an expired auth token if possible.
