const Utils = require('./Utils.js');
const { getEntityFC } = require('./SymbolHelper');

function bindHandlers(fc) {
    function provideErrors(req, errors, csnEntity, targetPrefix) {
        function buildPropertyString(descriptors) {
            return Object.entries(descriptors)
                .map(([key, desc]) => `${key}=${desc.value}`)
                .join(',');
        }

        function calculatePrefix() {
            const params = buildPropertyString(Object.getOwnPropertyDescriptors(req.params[0]));

            const entityName = Utils.getEntityName(csnEntity);

            return `/${entityName}(${params})`;
        }

        const prefix = targetPrefix || calculatePrefix();

        errors.forEach(({ fieldName, message }) => {
            req.error({
                target: `${prefix}/${fieldName}`,
                message,
                description: message,
                code: 400
            });
        });
    }

    async function validateWithFCs(req, dataForValidation) {
        const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

        // const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord);

        const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, dataForValidation), req);

        const { errors } = fc.validatePayload(dbRecordWithVirtualUpdate, req.data);

        return {
            dbRecord,
            dbRecordWithVirtualUpdate,
            errors
        }
    }

    // 1. Calculate FC for the DB record
    // 2. Merge DB record with changes and calculate FCs
    // 3. Apply validations
    // 4. Compare FC from steps 1 and 2
    // 5. Erase Fields which changed their FCs from Optional/Mandatory to Readonly/Hidden
    async function UPDATEHandler(req, next, context) {
        const { errors, dbRecordWithVirtualUpdate } = await validateWithFCs(req, req.data);

        fc.configuration.liveValidations && provideErrors(req, errors, fc.csnEntity);

        fc.configuration.autoErase && fc.eraseUnavailableDynamicFields(dbRecordWithVirtualUpdate, req.data);

        await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req);

        const record = await next();

        return await fc.calculateFieldControls(record, req, context);
    }

    async function DRAFTPrepareHandler(req, next) {
        const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

        const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord, req);

        const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data), req);

        const { errors } = fc.validatePayload(dbRecordWithFCs, dbRecordWithFCs);

        provideErrors(req, errors, fc.csnEntity, 'in');

        await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req);

        const record = await next();

        await fc.callOnAfterSave(dbRecordWithVirtualUpdate, req);

        return await fc.calculateFieldControls(record, req);
    }

    async function READHandler(entity, req, context) {
        return await fc.calculateFieldControls(entity, req, context);
    }

    async function CreateDraftHandler(req, next) {
        const record = await next();

        return await fc.calculateFieldControls(record, req), {};
    }

    return {
        UPDATEHandler,
        DRAFTPrepareHandler,
        READHandler,
        CreateDraftHandler,
        validateWithFCs,
        provideErrors
    }
}

function provideErrors(req, errors, targetPrefix) {
    const fc = getEntityFC(req.target);

    const { provideErrors } = bindHandlers(fc);

    return provideErrors(req, errors, fc.csnEntity, targetPrefix);
}

function throwErrorsAndStopIfExists(req, ...args) {
    provideErrors(req, ...args);

    if (req?.errors?.length) {
        req.reject();
    }
}

async function validateWithFCs(req, dataForValidation) {
    const fc = getEntityFC(req.target);

    const { validateWithFCs } = bindHandlers(fc);

    return (await validateWithFCs(req, dataForValidation)).errors;
}

module.exports = {
    async calculateFieldControls(data, req, { csnEntity, context = {} }) {
        const fc = getEntityFC(csnEntity || req.target);

        return await fc.calculateFieldControls(data, req, context);
    },
    bindHandlers,
    async execAfterREADHandler(entity, req, context) {
        const fc = getEntityFC(req.target);

        const { READHandler } = bindHandlers(fc);

        return await READHandler(entity, req, context);
    },

    async execUPDATEHandler(req, next, context) {
        const fc = getEntityFC(req.target);

        const { UPDATEHandler } = bindHandlers(fc);

        return await UPDATEHandler(req, next, context);

    },

    validateWithFCs,

    async validateAndThowErrorsIfExists(req, dataForValidation, targetPrefix) {
        throwErrorsAndStopIfExists(req, await validateWithFCs(req, dataForValidation), targetPrefix);
    },

    provideErrors,

    throwErrorsAndStopIfExists
};