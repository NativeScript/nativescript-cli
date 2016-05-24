PROJECT = "Kinvey JavaScript SDK Core"

all: clean install release

clean: ;@echo "Cleaning ${PROJECT}..."; \
	rm -rf node_modules

install: ;@echo "Installing dependencies for ${PROJECT}..."; \
	npm install

release: ;@echo "Building ${PROJECT}..."; \
	./node_modules/.bin/gulp release --type ${TYPE} --version ${VERSION}

.PHONY: clean install release
