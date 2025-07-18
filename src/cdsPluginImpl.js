const path = require('path');
const ServiceParser = require('./ServiceParser.js');
const { FieldControls } = require('./FieldControls.js');
const symbolHelper = require('./SymbolHelper');

function getEntityName(csnEntity) {
  return csnEntity.name.split('.').at(-1);
}

function provideErrors(req, errors, csnEntity, targetPrefix) {
  function buildPropertyString(descriptors) {
    return Object.entries(descriptors)
      .map(([ key, desc ]) => `${ key }=${ desc.value }`)
      .join(',');
  }

  function calculatePrefix() {
    const params = buildPropertyString(Object.getOwnPropertyDescriptors(req.params[0]));

    const entityName = getEntityName(csnEntity);

    return `/${ entityName }(${ params })`;
  }

  const prefix = targetPrefix || calculatePrefix();

  errors.forEach(({ fieldName, message }) => {
    req.error({
      target: `${ prefix }/${ fieldName }`,
      message,
      description: message,
      code: 400
    });
  });
}

module.exports = function(service) {
  const services = Array.isArray(service) ? service : [ service ];

  ServiceParser.onEachFCEntity(services, async (srv, csnEntity, configuration) => {
    const entityName = getEntityName(csnEntity);
    const configurationFilePath = path.resolve('./', configuration.path);

    const configurationEntity = require(configurationFilePath);

    const fc = new FieldControls(srv, csnEntity, configurationEntity, configuration);


    symbolHelper.addEntitityFCs(srv, { [entityName]: fc });

    if (csnEntity['@odata.draft.enabled']) {
      srv.on('draftPrepare', DRAFTPrepareHandler);
      srv.on('NEW', csnEntity.drafts, CREATEhandler);
      srv.after('READ', csnEntity.drafts, (e) => READhandler(e));
      srv.on('UPDATE', csnEntity.drafts, UPDATEhandler);
    }
    // TO DO: review
    srv.after('READ', csnEntity, (e) => READhandler(e));
    srv.on('UPDATE', csnEntity, UPDATEhandler);




    // 1. Calculate FC for the DB record
    // 2. Merge DB record with changes and calculate FCs
    // 3. Apply validations
    // 4. Compare FC from steps 1 and 2
    // 5. Erase Fields which changed their FCs from Optional/Mandatory to Readonly/Hidden

    async function UPDATEhandler(req, next) {
      const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

      const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord);

      const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data));

      const { errors } = fc.validatePayload(req, dbRecordWithFCs, req.data);

      configuration.liveValidations && provideErrors(req, errors, csnEntity);

      configuration.autoErase && fc.eraseUnavailableDynamicFields(dbRecordWithVirtualUpdate, req.data);

      await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req.data);

      const record = await next();

      return await fc.calculateFieldControls(record);
    }

    async function DRAFTPrepareHandler(req, next) {
      const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

      const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord);

      const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data));

      const { errors } = fc.validatePayload(req, dbRecordWithFCs, dbRecordWithFCs);

      provideErrors(req, errors, csnEntity, 'in');

      await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req.data);

      const record = await next();

      return await fc.calculateFieldControls(record);
    }

    async function READhandler(entity) {
      return await fc.calculateFieldControls(entity);
    }

    async function CREATEhandler(req, next) {
      const record = await next();

      return await fc.calculateFieldControls(record);
    }
  });
};
