// https://cap.cloud.sap/docs/node.js/fiori

const { fieldControlDictionary, handlers } = require('./src/FieldControls');
const cdsPluginImpl = require('./src/cdsPluginImpl');
const { execAfterREADHandler, execUPDATEHandler, validateWithFCs, provideErrors, throwErrorsAndStopIfExists, validateAndThowErrorsIfExists } = require('./src/Handlers');

module.exports = {
    fieldControlDictionary,
    init: cdsPluginImpl,
    ...handlers,
    execAfterREADHandler,
    execUPDATEHandler,
    validateWithFCs,
    provideErrors,
    throwErrorsAndStopIfExists,
    validateAndThowErrorsIfExists
};
