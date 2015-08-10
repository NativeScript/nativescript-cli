clean: rm -rf node_modules

test: all

all:  test-request

test-request:
	@./node_modules/.bin/gulp test-request

.PHONY: test
