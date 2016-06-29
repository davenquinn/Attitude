BIN := node_modules/.bin
BASE := attitude/display
ASSETS := $(BASE)/assets
BUILD := $(BASE)/templates/build

SCRIPT := $(BUILD)/stereonet.js

all: assets

.PHONY: install clean assets
install:
	npm install
clean:
	rm -f $(SCRIPT)
assets: $(SCRIPT) $(BUILD)/style.css

$(BUILD):
	mkdir -p $@

$(ASSETS):
	mkdir -p $@

coffee = $(ASSETS) $(wildcard $(ASSETS)/*.coffee)

watch: $(coffee) | $(BUILD)
	$(BIN)/watchify -t coffeeify $</index.coffee -o $(SCRIPT)

$(SCRIPT): $(coffee) | $(BUILD)
	$(BIN)/browserify -t coffeeify $</index.coffee > $@

$(BUILD)/style.css: $(ASSETS)/style.scss | $(BUILD)
	rm -f $@
	cat $^ | $(BIN)/node-sass > $@

