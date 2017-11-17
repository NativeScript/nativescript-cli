#!/bin/sh

# This script updates the Kinvey HTML5 SDK Github Repo with the latest release

dist="$(dirname "$0")/../dist"
tmp="$(dirname "$0")/../tmp"
git config user.name "Travis CI"
git config user.email "travis@travis-ci.org"
git clone https://${GITHUB_ACCESS_TOKEN}@github.com/Kinvey/html5-sdk.git $tmp > /dev/null 2>&1
git -C $tmp remote add origin https://${GITHUB_ACCESS_TOKEN}@github.com/Kinvey/html5-sdk.git > /dev/null 2>&1
git -C $tmp fetch origin
git -C $tmp checkout master
cp -r $dist/. $tmp
git -C $tmp add .
git -C $tmp commit -m "Travis Build: $TRAVIS_BUILD_NUMBER"
git -C $tmp tag $TRAVIS_TAG
git -C $tmp push --tags --quiet --set-upstream origin master
