# Makefile for easy testing

test: all

all: test-user

test-user:
	@./node_modules/.bin/mocha --compilers js:babel/register --reporter spec --slow 500 --timeout 2000 test/specs/user.spec.js

.PHONY: test
