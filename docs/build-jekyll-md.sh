#!/usr/bin/env bash
set -e

rm -rf docs-cli
npm install --ignore-scripts

npx grunt docs-jekyll
