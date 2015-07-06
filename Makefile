# Makefile for easy testing

coverage:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --compilers js:babel/register --reporter spec --slow 100 --timeout 2000 test/specs/**/*.spec.js

test: all

all: test-user

test-user:
	@./node_modules/.bin/_mocha --compilers js:babel/register --reporter spec --slow 100 --timeout 2000 test/specs/user.spec.js

.PHONY: test coverage
