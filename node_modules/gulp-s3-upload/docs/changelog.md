# Changelog

## Version 1.6.0

*  Stream support added thanks to [@algesten](https://github.com/algesten) - [PR #34](https://github.com/clineamb/gulp-s3-upload/pull/34)
*  [aws-sdk](https://github.com/aws/aws-sdk-js) upgraded.



## Version 1.5.2
* Update modules
    *  `aws-sdk` module (2.2.18 -> 2.2.42)
    *  `hasha` module (2.0.2 -> 2.2.0)
    

## Version 1.5.1
* Merge bug fix [pull request #31](https://github.com/clineamb/gulp-s3-upload/pull/31) to fix the hash-comparison (calling the `noChange` callback on upon equal hash comparison)
* Update docs (typos, clairty)
* Update `aws-sdk` module (2.2.15 -> 2.2.18).


## Version 1.5.0
* **NEW** -- Added post-upload callback options, by [benib](http://github.com/benib) in [pull request #30](http://github.com/clineamb/gulp-s3-upload/pull/30)
* Upgrade `aws-sdk` node module (2.2.11 -> 2.2.15)


## Version 1.4.4
* Fix parameter name in Readme.md [(issue #27)](http://github.com/clineamb/gulp-s3-upload/issues/27)
* Add an option for config to take `{useIAM:true}` to be explicit
* Upgrade packages (all patch versions)


## Version 1.4.3
*  Fix issue [issue #26](http://github.com/clineamb/gulp-s3-upload/issues/23)
  *  Move things into `s3.headObject` call to prevent mutable variable errors.
*  Clean up some comments.
*  Update Readme to clarify `config` hash in the config section.


## Version 1.4.2

* Update file-hashing function with [hasha](http://github.com/sindresorhus/hasha) from a signature change.  Simply pull file buffer instead of promise for simplicity sake.
* Remove old `console.log` from local dev.


## Version 1.4.0, 1.4.1

* Add second paramter to task to take in [S3 Constructor options](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property).
* 1.4.1: Quickly remove a hanging `console.log` from development.

## Version 1.3.1

* Fix Metadata/ContentEncoding overwrite.


## Version 1.3.0

* **NEW** -- Added `maps.ParamName` options!  You can now map each parameter offered by the `S3.putObject` function. More in the [Readme](readme.md).
* Fixed [issue #23](https://github.com/clineamb/gulp-s3-upload/issues/23) on existing mapping functions (`metadataMap`, `manualContentEncoding`).
* Updated Readme.


## Version 1.2.0

* Added `manualContentEncoding` option from [pull request #22](https://github.com/clineamb/gulp-s3-upload/pull/22)


## Version 1.1.2

* Bugfix -- Remove unused `file_counts` variable.
* Clean up some indents and codes.


## Version 1.1.1

* Bugfix -- Missing comma. Fixed in [pull request #17](https://github.com/clineamb/gulp-s3-upload/pull/17)


## Version 1.1.0

* Added better ETag (AWS vs. local) comparison from [pull request #16](https://github.com/clineamb/gulp-s3-upload/pull/16)
  * Added option `etag_hash` just in case AWS ETag comparison is not MD5 algorithm.  [More info here.](http://docs.aws.amazon.com/AmazonS3/latest/API/RESTCommonResponseHeaders.html)
* **Plugin is now ASYNC!**
  * @thomaswelton beat me to the punch, but I've added it (and the ETag comparing) to be the first feature in our next minor version! Horray!
  * From [pull request #14](https://github.com/clineamb/gulp-s3-upload/pull/14)
* Updated Readme, cleaned up code.


## Version 1.0.5
* Added SDK config discovery + https_proxy support from [pull request #12](https://github.com/clineamb/gulp-s3-upload/pull/12).
* Removed requirement to have AWS Key/Secret (due to settings be in IAM), as per [pull request #13](https://github.com/clineamb/gulp-s3-upload/pull/13).


## Version 1.0.4

* Forgot to add a Readme entry for `charset` option.


## Version 1.0.3

* Allow charset option so S3 will give the correct Content-Type, as per [pull request #8](http://github.com/clineamb/gulp-s3-upload/pull/8)
* Update some comments


## Version 1.0.2

* Put metadata into its own var to prevent mutation between files, as per [pull request #7](http://github.com/clineamb/gulp-s3-upload/pull/7)
* Clean up comments and update others.

__3/11/2015__


## Version 1.0.1

* Update to use headObject as reccomended by [pull request #6](http://github.com/clineamb/gulp-s3-upload/pull/6)
* Update logging and colors.
* Fix typos in Readme.


## Version 1.0

* See changes beta-1.0 changes.
* Added `uploadNewFilesOnly` flag option.
* Fixed issue [#3](http://github.com/clineamb/gulp-s3-upload/issues/3), files stopping at a certain number consistently.


## Version beta-1.0

* AWS constructor now follows [AWS-SDK constructor parameters.](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property).
* pipe transform `s3()` now only takes one `options` param that is parallel to the [AWS-S3 putObject method](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property).
  * This makes the parameters case-sensitive.
  * Transforms are filtered out of the `options` param.
* Changed lookup/transform options:
  * `name_transform` to `keyTransform` (or `nameTransform`)
  * `mime_type_lookup` to `mimeTypeLookup`
* Added `metadataMapper` as an option (see [docs](readme.md) for more details).
* `ACL` option for `putObject` no longer defaults to `public-read`. Must be user defined.


### Version 0.8.6

* Unchanged the `name_transform` & `mime_type_lookup` function names; could break.  Will change in Version 1


### Version 0.8.5

* Added optional second paramter that takes
* Merged a [pull request](https://github.com/clineamb/gulp-s3-upload/pull/5) to allow the AWS constructor to take any parameters based on the [AWS Config documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property).
* Merged a [pull request](https://github.com/clineamb/gulp-s3-upload/pull/4) to allow for an different mime-type lookup.
* Updated `Readme.md` to reflect new updates.
* Added [roadmap.md](roadmap.md) to document upcoming changes.
* Added a changlog!