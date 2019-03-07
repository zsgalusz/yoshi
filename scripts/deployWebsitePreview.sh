cd website
yarn install
yarn build
npx surge --project ./build --domain wix-yoshi-${TRAVIS_PULL_REQUEST}.surge.sh
