#!/bin/sh

REV=$(($(date +%s%N)/1000000))
ZIP_BUILD="build"

rm ./*.zip
yarn build
rm ./public/build/*.map
cd ./public && zip -r "./${ZIP_BUILD}_${REV}.zip" * && cp "./${ZIP_BUILD}_${REV}.zip" ../ && rm "./${ZIP_BUILD}_${REV}.zip"
