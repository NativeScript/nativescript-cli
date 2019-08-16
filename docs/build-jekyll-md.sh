#!/usr/bin/env bash
set -e

rm -rf docs-cli
npm install --ignore-scripts

grunt docs-jekyll
