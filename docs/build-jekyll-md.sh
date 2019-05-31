#!/usr/bin/env bash
set -e

rm -rf docs-cli
npm install --ignore-scripts

grunt docs-jekyll
if [ -d docs-cli ]; then 
    cd docs-cli
    mv index.md start.md 
fi