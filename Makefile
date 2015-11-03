clean:
	@echo "Cleaning"

install:
	@echo "Install Dependencies" && npm install

test:
	@./node_modules/.bin/gulp test

test-database:
	@./node_modules/.bin/gulp test-database

test-query:
	@./node_modules/.bin/gulp test-query

test-request:
	@./node_modules/.bin/gulp test-request

test-user:
	@./node_modules/.bin/gulp test-user

all: test

.PHONY: test
