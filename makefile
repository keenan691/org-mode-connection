install:
	yarn build
	cp -r ./dist ~/projects/react-native/new-organic/node_modules/org-mode-connection
	cp ./src/index.d.ts ~/projects/react-native/new-organic/node_modules/org-mode-connection/src/index.d.ts

build:
	yarn build

yarn-install:
	yarn install

yarn-test:
	yarn test
