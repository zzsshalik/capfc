const { fieldControlDictionary } = require('./src/FieldControls');
const cdsPluginImpl = require('./src/cdsPluginImpl');

module.exports = { fieldControlDictionary, init: cdsPluginImpl };
