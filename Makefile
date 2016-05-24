PROJECT = "Kinvey JavaScript SDK Core"

all: clean install build

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

build: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp default --version ${VERSION}

.PHONY: clean install build
