PROJECT = "Kinvey JavaScript SDK Core"

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

test: ;@echo "Testing ${PROJECT}..."; \
	npm run test:jenkins

build: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp default

publish: ;@echo "Publishing ${PROJECT}..."; \
	npm install -g ci-npm-publish
	npm publish --npmuser ${NPM_USER} --npmemail ${NPM_EMAIL} --npmpassword ${NPM_PASSWORD}
	npm uninstall -g ci-npm-publish

audit: clean install test
release: audit build publish

.PHONY: clean install test build publish audit release
