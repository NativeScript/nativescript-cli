clean:
	@echo "Cleaning"

install:
	@echo "Install Dependencies" && npm install

test:  test-request

test-request:
	@./node_modules/.bin/gulp test-request

test-user:
	@./node_modules/.bin/gulp test-user

all: clean \
	install \
	test

.PHONY: test
