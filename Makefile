# Makefile for easy testing

test: all

all: test-http \
	test-httpMethod \
	test-nodeRequest \
	test-response

test-http:
	@./node_modules/.bin/mocha --compilers js:babel/register --reporter spec --slow 500 --timeout 2000 server_test/spec/http.js

test-httpMethod:
	@./node_modules/.bin/mocha --compilers js:babel/register --reporter spec --slow 500 --timeout 2000 server_test/spec/httpMethod.js

test-nodeRequest:
	@./node_modules/.bin/mocha --compilers js:babel/register --reporter spec --slow 500 --timeout 2000 server_test/spec/nodeRequest.js

test-response:
	@./node_modules/.bin/mocha --compilers js:babel/register --reporter spec --slow 500 --timeout 2000 server_test/spec/response.js

.PHONY: test
