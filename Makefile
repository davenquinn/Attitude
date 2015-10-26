BASE := attitude/display
ASSETS := $(BASE)/assets
BUILD := $(BASE)/templates/build

SCRIPT := $(BUILD)/stereonet.js

all: $(SCRIPT) $(BUILD)/style.css

.PHONY: install clean
install:
	npm install -g browserify
	npm install -g node-sass
	npm install coffeeify
	npm install d3

clean:
	rm -f $(SCRIPT)

watch: $(ASSETS)
	which watchify || npm install -g watchify
	watchify -t coffeeify $^/index.coffee -o $(SCRIPT)

$(SCRIPT): $(ASSETS)/index.coffee
	browserify -t coffeeify $^ > $@

$(BUILD)/style.css: $(ASSETS)/style.scss
	rm -f $@
	cat $^ | node-sass > $@

