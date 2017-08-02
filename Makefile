.PHONY: all info clean debug release website

NPM = npm
BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs

BUILDDIR = build
VERSION = $(or ${BRCMAP_VERSION}, 0.0.0)
VERSION_MAJOR = $(shell echo $(VERSION) | sed -E 's/^([0-9]+).*/\1/')

LIBRARY_SOURCES = $(shell find src -type f -name "*.js")
LIBRARY_MAIN = src/index.js 

all: info debug release website

info:
	@echo "Version: $(VERSION)"

clean:
	rm -rf build
	rm -rf node_modules

debug: $(BUILDDIR)/dist/brcmap.debug.js  

release: $(BUILDDIR)/dist/brcmap.min.js

website: $(BUILDDIR)/www/index.html 

node_modules: 
	$(NPM) install 

$(BUILDDIR)/dist/brcmap.min.js: Makefile node_modules $(LIBRARY_SOURCES)
	@mkdir -p $(dir $@)
	NODE_ENV=production $(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] $(LIBRARY_MAIN) |\
		$(UGLIFY) --compress --mangle > $@

$(BUILDDIR)/dist/brcmap.debug.js: Makefile node_modules $(LIBRARY_SOURCES) 
	@mkdir -p $(dir $@)
	NODE_ENV=development $(BROWSERIFY) --transform [babelify --presets [ es2015 ] ] --debug $(LIBRARY_MAIN) > $@

$(BUILDDIR)/www/index.html: Makefile demo/index.html $(addprefix $(BUILDDIR)/www/, v$(VERSION_MAJOR)/min.js styles.css)
	sed -E -e 's/(script id=\"mainscript\" src=\").*\"/\1v$(VERSION_MAJOR)\/min.js"/g' -e 's/v0\.0\.0/v$(VERSION)/g' demo/index.html > $@

$(BUILDDIR)/www/v$(VERSION_MAJOR)/min.js: $(BUILDDIR)/dist/brcmap.min.js Makefile
	@mkdir -p $(dir $@)
	cp $< $@

$(BUILDDIR)/www/%: demo/% Makefile
	@mkdir -p $(dir $@)
	cp $< $@


