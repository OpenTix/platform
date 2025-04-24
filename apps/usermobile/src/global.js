// TextEncoder is not in the ECMAScript standard so we have to force our app to use the text-encoding package
global.TextEncoder = require('text-encoding').TextEncoder;
global.TextDecoder = require('text-encoding').TextDecoder;
