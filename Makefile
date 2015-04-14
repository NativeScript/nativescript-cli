# Makefile for easy testing

test: all

all: test-example \
			test-mic

prepare:
	@./node_modules/.bin/grunt deploy

test-example:
	@./node_modules/.bin/mocha --reporter spec --slow 500 --timeout 2000 test/example.spec.js

test-mic:
	@./node_modules/.bin/mocha --reporter spec --slow 500 --timeout 2000 test/core/mic.spec.js

.PHONY: test
