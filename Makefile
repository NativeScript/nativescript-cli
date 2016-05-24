PROJECT = "Kinvey JavaScript SDK Core"
VERSION = $(shell node -pe 'require("./package.json").version')

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

test: ;@echo "Testing ${PROJECT}..."; \
	npm run test:jenkins

build: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp default

tag: ;@echo "Tagging ${PROJECT}..."; \
	git tag ${VERSION}
	git push --tags origin HEAD:master

publish: ;@echo "Publishing ${PROJECT}..."; \
	npm publish . --tag beta

audit: clean install test
release: audit build tag publish

.PHONY: clean install test release tag publish
