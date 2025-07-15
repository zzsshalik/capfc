const path = require('path');
const ServiceParser = require('./ServiceParser.js');
const { FieldControls } = require('./FieldControls.js');

function getEntityName(csnEntity) {
  return csnEntity.name.split('.').at(-1);
}

module.exports = function(service) {
  const services = Array.isArray(service) ? service : [ service ];

  ServiceParser.onEachFCEntity(services, async (srv, csnEntity, configuration) => {
    const configurationFilePath = path.resolve('./', configuration.path);

    const configurationEntity = require(configurationFilePath);

    if (csnEntity['@odata.draft.enabled']) {
      srv.on('NEW', csnEntity.drafts, async (req, next) => {
        //   const record = await SELECT.one.from(req.target).where(req.params.at(0));
        const record = await next();

        return FieldControls.calculateFieldControls(csnEntity, configurationEntity, record);
      });

      srv.after('READ', csnEntity.drafts, async (entity) => FieldControls.calculateFieldControls(csnEntity, configurationEntity, entity));
    }

    srv.after('READ', csnEntity, async (entity) => FieldControls.calculateFieldControls(csnEntity, configurationEntity, entity));

    srv.after('UPDATE', csnEntity, async (update, req) => {
      const entityName = getEntityName(csnEntity);
      const entity = await SELECT.one.from(csnEntity).where({ ID: update.ID });
      const entityWithFCs = FieldControls.calculateFieldControls(csnEntity, configurationEntity, entity);

      const { errors } = FieldControls.validatePayload(req, configurationEntity, entityWithFCs, csnEntity, update);

      errors.forEach(({ fieldName, message }) => {
        req.error({
          target: `/${ entityName }(ID='${ req.data.ID }')/${ fieldName }`,
          message,
          description: message,
          code: 400
        });
      });

      return req;
    });
  });
};
