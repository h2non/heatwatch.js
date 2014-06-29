BROWSERIFY = node ./node_modules/browserify/bin/cmd.js
MOCHA = ./node_modules/.bin/mocha
UGLIFYJS = ./node_modules/.bin/uglifyjs
BANNER = "/*! heatwatch.js - v0.1 - MIT License - https://github.com/h2non/heatwatch.js */"

define release
	VERSION=`node -pe "require('./package.json').version"` && \
	NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
	node -e "\
		var j = require('./package.json');\
		j.version = \"$$NEXT_VERSION\";\
		var s = JSON.stringify(j, null, 2);\
		require('fs').writeFileSync('./package.json', s);" && \
	node -e "\
		var j = require('./bower.json');\
		j.version = \"$$NEXT_VERSION\";\
		var s = JSON.stringify(j, null, 2);\
		require('fs').writeFileSync('./bower.json', s);" && \
	git commit -am "release $$NEXT_VERSION" && \
	git tag "$$NEXT_VERSION" -m "Version $$NEXT_VERSION"
endef

define replace
	node -e "\
		var fs = require('fs'); \
		var os = require('os-shim'); \
		var str = fs.readFileSync('./hu.js').toString(); \
		str = str.split(os.EOL).map(function (line) { \
		  return line.replace(/^void 0;/, '') \
		}).filter(function (line) { \
		  return line.length \
		}).join(os.EOL); \
		fs.writeFileSync('./hu.js', str)"
endef

default: all
all: test browser
browser: cleanbrowser test banner browserify replace uglify
test: compile mocha

mkdir:
	mkdir -p lib

banner:
	@echo $(BANNER) > hu.js

browserify:
	$(BROWSERIFY) \
		--exports require \
		--standalone hu \
		--entry ./lib/hu.js >> ./hu.js

replace:
	@$(call replace)

uglify:
	$(UGLIFYJS) hu.js --mangle --preamble $(BANNER) > hu.min.js

clean:
	rm -rf lib/*

cleanbrowser:
	rm -f *.js

mocha:
	$(MOCHA) --reporter spec --ui tdd --compilers wisp:$(WISP_MODULE)

loc:
	wc -l src/*

release:
	@$(call release, patch)

release-minor:
	@$(call release, minor)

publish: browser release
	git push --tags origin HEAD:master
	npm publish