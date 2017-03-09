mkdir -p dist/scripts/slider-revolutions/css
curl -O "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/css/style.css" dist/scripts/slider-revolution/css/style.css
curl -O "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/css/settings.css" dist/scripts/slider-revolution/css/settings.css

mkdir -p dist/scripts/slider-revolutions/js
curl -O "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/js/jquery.themepunch.tools.min.js" dist/scripts/slider-revolution/js/jquery.tools.min.js
curl -O "http://s3.amazonaws.com/rise-common/scripts/slider-revolution/js/jquery.themepunch.revolution.min.js" dist/scripts/slider-revolution/js/jquery.themepunch.revolution.min.js

mkdir -p dist/jquery
curl -O "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" dist/jquery/jquery.min.js

mkdir -p dist/gadgets
curl --compressed -O "http://rvashow2.appspot.com/gadgets/gadgets.min.js" dist/gadgets/gadgets.min.js
