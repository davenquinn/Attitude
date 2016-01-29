BIN := node_modules/.bin
BASE := attitude/display
ASSETS := $(BASE)/assets
BUILD := $(BASE)/templates/build

SCRIPT := $(BUILD)/stereonet.js

all: $(SCRIPT) $(BUILD)/style.css

.PHONY: install clean
install:
	npm install
clean:
	rm -f $(SCRIPT)

$(BUILD):
	mkdir -p $@

$(ASSETS):
	mkdir -p $@

watch: $(ASSETS)
	$(BIN)/watchify -t coffeeify $^/index.coffee -o $(SCRIPT)

$(SCRIPT): $(ASSETS)/index.coffee | $(ASSETS) $(BUILD)
	$(BIN)/browserify -t coffeeify $^ > $@

$(BUILD)/style.css: $(ASSETS)/style.scss | $(BUILD)
	rm -f $@
	cat $^ | $(BIN)/node-sass > $@

