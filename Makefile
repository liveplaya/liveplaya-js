.PHONY: all docs debug clean test

BUILDDIR = build
NPM = npm
BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs

LIBRARY_SOURCES = $(shell find src -type f -name "*.js")
LIBRARY_MAIN = src/index.js 

all: demo $(BUILDDIR)/brcmap.min.js

demo: $(BUILDDIR)/brcmap.debug.js  

$(BUILDDIR)/brcmap.min.js: Makefile node_modules $(LIBRARY_SOURCES)
	@mkdir -p $(dir $@)
	NODE_ENV=production $(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] $(LIBRARY_MAIN) | $(UGLIFY) --compress --mangle > $@

$(BUILDDIR)/brcmap.debug.js: Makefile node_modules $(LIBRARY_SOURCES) 
	@mkdir -p $(dir $@)
	NODE_ENV=development $(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] --debug $(LIBRARY_MAIN) > $@

node_modules:
	$(NPM) install 

clean:
	rm -rf build
	rm -rf node_modules


