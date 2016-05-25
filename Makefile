PROJECT = "Kinvey JavaScript SDK Core"

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

test: ;@echo "Testing ${PROJECT}..."; \
	npm run test:jenkins

build: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp default
	git add es5/\*.js
	git commit -m "Update es5 files."

publish: ;@echo "Publishing ${PROJECT}..."; \
	npm install ci-npm-publish
	npm publish --npmuser ${NPMUSER} --npmemail ${NPMEMAIL} --npmpassword ${NPMPASSWORD}

audit: clean install test
release: audit build publish

.PHONY: clean install test build publish audit release
