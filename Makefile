
.PHONY: docs

docs:
	cd docs && docker run -it -v "$(pwd):/docs" .
