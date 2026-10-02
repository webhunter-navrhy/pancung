#!/bin/sh
# cache busting: ?v=<hash> u CSS/JS
cd "$(dirname "$0")"
C=$(shasum style.css | cut -c1-8); J=$(shasum main.js | cut -c1-8)
sed -i '' -E "s/style\.css\?v=[^\"]*/style.css?v=$C/; s/main\.js\?v=[^\"]*/main.js?v=$J/" index.html
echo "css $C js $J"
