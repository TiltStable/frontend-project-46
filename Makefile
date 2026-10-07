.PHONY: install start test test-coverage lint lint-fix publish

install:
	npm ci

start:
	node bin/gendiff.js

test:
	npm test

test-coverage:
	npm test -- --coverage

lint:
	npx oxlint && npx oxfmt --ignore-path=.oxfmtignore --check

lint-fix:
	npx oxfmt && npx oxlint --fix

publish:
	npm publish --dry-run
