// https://cap.cloud.sap/docs/node.js/fiori

const { fieldControlDictionary, handlers } = require('./src/FieldControls');
const cdsPluginImpl = require('./src/cdsPluginImpl');
const Utils = require('./src/Utils');

const {
    execAfterREADHandler,
    execUPDATEHandler,
    validateWithFCs,
    provideErrors,
    throwErrorsAndStopIfExists,
    validateAndThowErrorsIfExists,
    calculateFieldControls
} = require('./src/Handlers');

module.exports = {
    Utils,
    fieldControlDictionary,
    init: cdsPluginImpl,
    ...handlers,

    calculateFieldControls,
    execAfterREADHandler,
    execUPDATEHandler,
    validateWithFCs,
    provideErrors,
    throwErrorsAndStopIfExists,
    validateAndThowErrorsIfExists
};
