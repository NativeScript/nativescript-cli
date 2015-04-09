# Makefile for easy testing

test: all

all: test-example

test-example:
	@./node_modules/.bin/mocha --reporter spec --slow 500 --timeout 2000 --prof test/example.spec.js

.PHONY: test
