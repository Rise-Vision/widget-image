aws --no-sign s3 cp s3://rise-common/scripts/slider-revolution ./dist/scripts/slider-revolution --recursive --exclude "*.psd"

mkdir -p dist/jquery
curl "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" -o dist/jquery/jquery.min.js

mkdir -p dist/gadgets
curl --compressed "http://rvashow2.appspot.com/gadgets/gadgets.min.js" -o dist/gadgets/gadgets.min.js
