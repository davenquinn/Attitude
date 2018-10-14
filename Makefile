BIN := js-frontend/node_modules/.bin
BASE := js-frontend
ASSETS := $(BASE)/src
BUILD := $(BASE)/assets

SCRIPT := $(BUILD)/stereonet.js

all: assets docs

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

$(BUILD)/style.css: $(ASSETS)/style.styl | $(BUILD)
	rm -f $@
	cat $^ | $(BIN)/stylus > $@

.PHONY: docs
docs:
	cd docs && make html

# Build skeleton documentation for the python API
.PHONY: api-docs
api-docs: attitude
	sphinx-apidoc -o docs/python-api $^
