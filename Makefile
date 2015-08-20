clean:
	@echo "Cleaning"

install:
	@echo "Install Dependencies" && npm install

test: test-database \
	test-query \
	test-request

test-database:
	@./node_modules/.bin/gulp test-database

test-query:
	@./node_modules/.bin/gulp test-query

test-request:
	@./node_modules/.bin/gulp test-request

test-user:
	@./node_modules/.bin/gulp test-user

all: clean \
	install \
	test

.PHONY: test
