PROJECT = "Kinvey JavaScript SDK Core"

all: clean install test

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

test: ;@echo "Testing ${PROJECT}..."; \
	npm run test:jenkins

release: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp release --type ${TYPE} --version ${VERSION}

.PHONY: clean install test release
