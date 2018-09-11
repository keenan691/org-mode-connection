test-watch:
		./node_modules/.bin/jest --color -o -b --watch --notify
test-all:
		./node_modules/.bin/jest --color
test-imports:
		./node_modules/.bin/jest --color --watch perf
