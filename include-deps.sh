mkdir -p dist/scripts/slider-revolution/css
curl "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/css/style.css" -o dist/scripts/slider-revolution/css/style.css
curl "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/css/settings.css" -o dist/scripts/slider-revolution/css/settings.css

mkdir -p dist/scripts/slider-revolution/js
curl "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/js/jquery.themepunch.tools.min.js" -o dist/scripts/slider-revolution/js/jquery.themepunch.tools.min.js
curl "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/js/jquery.themepunch.revolution.min.js" -o dist/scripts/slider-revolution/js/jquery.themepunch.revolution.min.js

mkdir -p dist/jquery
curl "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" -o dist/jquery/jquery.min.js

mkdir -p dist/gadgets
curl --compressed "http://rvashow2.appspot.com/gadgets/gadgets.min.js" -o dist/gadgets/gadgets.min.js
