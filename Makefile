PROJECT = "Kinvey JavaScript SDK Core"
PKGVERSION = $(shell node -pe 'require("./package.json").version')

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

test: ;@echo "Testing ${PROJECT}..."; \
	npm run test:jenkins

build: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp default

version: ;@echo "Saving version to env.properties..."; \
	echo VERSION=$PKGVERSION > env.properties

audit: clean install test
release: audit build version

.PHONY: clean install test release version
