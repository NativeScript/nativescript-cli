install:
	@echo "Install Dependencies" && npm install

release:
	@./node_modules/.bin/gulp release

all: install /
	release

.PHONY: install release
