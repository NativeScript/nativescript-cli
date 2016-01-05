clean:
	@echo "Cleaning" && rm -rf node_modules

install:
	@echo "Installing Dependencies" && npm install

release:
	@./node_modules/.bin/gulp release

all: clean \
	install \
	release

.PHONY: install release
