.PHONY: all debug clean test

BUILDDIR = build
NPM = npm
BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs

all: demo $(BUILDDIR)/brcmap.min.js

demo: $(BUILDDIR)/brcmap.debug.js  

$(BUILDDIR)/brcmap.min.js: Makefile node_modules $(shell find lib -type f) 
	mkdir -p $(dir $@)
	#$(NPM) version $(VERSION)
	$(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] --debug lib/index.js | $(UGLIFY) -c > $@

$(BUILDDIR)/brcmap.debug.js: Makefile node_modules $(shell find lib -type f) 
	mkdir -p $(dir $@)
	$(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] --debug lib/index.js > $@

node_modules:
	$(NPM) install 

clean:
	rm -rf build
	rm -rf node_modules

