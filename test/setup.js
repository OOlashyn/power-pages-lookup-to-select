// load jQuery, Select2 and LtS into jsdom the same way they are loaded on a Power Pages page
const $ = require("jquery");

window.$ = window.jQuery = $;
require("select2")(window, $);
require("../src/index.js");
