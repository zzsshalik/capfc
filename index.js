// https://cap.cloud.sap/docs/node.js/fiori

const { fieldControlDictionary, handlers } = require('./src/FieldControls');
const cdsPluginImpl = require('./src/cdsPluginImpl');
const { execAfterREADHandler, execUPDATEHandler } = require('./src/Handlers');

module.exports = {
    fieldControlDictionary,
    init: cdsPluginImpl,
    ...handlers,
    execAfterREADHandler,
    execUPDATEHandler
};
