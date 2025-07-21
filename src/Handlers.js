const Utils = require('./Utils.js');
const { getEntityFC } = require('./SymbolHelper');

function bindHandles(fc) {
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

    // 1. Calculate FC for the DB record
    // 2. Merge DB record with changes and calculate FCs
    // 3. Apply validations
    // 4. Compare FC from steps 1 and 2
    // 5. Erase Fields which changed their FCs from Optional/Mandatory to Readonly/Hidden
    async function UPDATEHandler(req, next) {
        const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

        const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord);

        const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data));

        const { errors } = fc.validatePayload(req, dbRecordWithVirtualUpdate, req.data);

        fc.configuration.liveValidations && provideErrors(req, errors, fc.csnEntity);

        fc.configuration.autoErase && fc.eraseUnavailableDynamicFields(dbRecordWithVirtualUpdate, req.data);

        await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req);

        const record = await next();

        return await fc.calculateFieldControls(record);
    }

    async function DRAFTPrepareHandler(req, next) {
        const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

        const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord);

        const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data));

        const { errors } = fc.validatePayload(req, dbRecordWithFCs, dbRecordWithFCs);

        provideErrors(req, errors, fc.csnEntity, 'in');

        await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req);

        const record = await next();

        await fc.callOnAfterSave(dbRecordWithVirtualUpdate, req);

        return await fc.calculateFieldControls(record);
    }

    async function READHandler(entity) {
        return await fc.calculateFieldControls(entity);
    }

    async function CreateDraftHandler(req, next) {
        const record = await next();

        return await fc.calculateFieldControls(record);
    }

    return {
        UPDATEHandler,
        DRAFTPrepareHandler,
        READHandler,
        CreateDraftHandler
    }
}

async function execAfterREADHandler(entity, req) {
    const fc = getEntityFC(req.target);

    const { READHandler } = bindHandles(fc);

    return await READHandler(entity);
}

async function execUPDATEHandler(req, next) {
    const fc = getEntityFC(req.target);

    const { UPDATEHandler } = bindHandles(fc);

    return await UPDATEHandler(req, next);

}

module.exports = { bindHandles, execAfterREADHandler, execUPDATEHandler };