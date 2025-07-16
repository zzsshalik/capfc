const path = require('path');
const ServiceParser = require('./ServiceParser.js');
const { FieldControls } = require('./FieldControls.js');

function getEntityName(csnEntity) {
  return csnEntity.name.split('.').at(-1);
}

function provideErrors(req, errors, csnEntity) {
  function buildPropertyString(descriptors) {
    return Object.entries(descriptors)
    .map(([ key, desc ]) => `${ key }=${ desc.value }`)
    .join(',');
  }

  const params = buildPropertyString(Object.getOwnPropertyDescriptors(req.params[0]));

  const entityName = getEntityName(csnEntity);

  errors.forEach(({ fieldName, message }) => {
    req.error({
      target: `/${ entityName }(${ params })/${ fieldName }`,
      message,
      description: message,
      code: 400
    });
  });
}

module.exports = function(service) {
  const services = Array.isArray(service) ? service : [ service ];

  ServiceParser.onEachFCEntity(services, async (srv, csnEntity, configuration) => {
    const configurationFilePath = path.resolve('./', configuration.path);

    const configurationEntity = require(configurationFilePath);

    const fc = new FieldControls(csnEntity, configurationEntity);

    //
    // 1. Calculate FC for the DB record
    // 2. Merge DB record with changes and calculate FCs
    // 3. Apply validations
    // 4. Compare FC from steps 1 and 2
    // 5. Erase Fields which changed their FCs from Optional/Mandatory to Readonly/Hidden
    //
    async function UPDATEhandler(req, next) {
      const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

      const dbRecordWithFCs = fc.calculateFieldControls(dbRecord);

      const dbRecordWithVirtualUpdate = fc.calculateFieldControls(Object.assign({}, dbRecord, req.data));

      const { errors } = fc.validatePayload(req, dbRecordWithFCs, req.data);

      provideErrors(req, errors, csnEntity);

      await fc.calculateDynamicFields(dbRecordWithVirtualUpdate, req.data);

      const record = await next();

      return fc.calculateFieldControls(record);
    }

    async function READhandler(entity) {
      return fc.calculateFieldControls(entity);
    }

    async function CREATEhandler(req, next) {
      const record = await next();

      return fc.calculateFieldControls(record);
    }

    if (csnEntity['@odata.draft.enabled']) {
      srv.on('NEW', csnEntity.drafts, CREATEhandler);
      srv.after('READ', csnEntity.drafts, READhandler);
      srv.on('UPDATE', csnEntity.drafts, UPDATEhandler);
    }

    srv.after('READ', csnEntity, READhandler);
    srv.after('UPDATE', csnEntity, UPDATEhandler);
  });
};
