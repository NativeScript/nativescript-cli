#!/bin/bash

git stash -q --keep-index

branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

if [ "$branch" ==  "develop" ]; then
    echo 'Commit on develop: Running eslint and unit tests on entire repo.'
    $(npm bin)/gulp test
else
    echo 'Commit on non-develop branch: Running eslint on current changeset.'
    git diff-index --cached HEAD --name-only --diff-filter ACMR | egrep '.js$' | xargs $(npm bin)/eslint
fi

RESULT=$?

git stash pop -q

[ $RESULT -ne 0 ] && exit 1
exit 0
