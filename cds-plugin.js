const ServiceParser = require("./src/ServiceParser.js");
const { FieldControls } = require("./src/FieldControls.js");
const path = require("path");

cds.once("served", async () => {
  ServiceParser.onEachFCEntity(cds.services, async (srv, csnEntity, configuration) => {
    const configurationFilePath = path.resolve("./", configuration.path);

    const configurationEntity = require(configurationFilePath);

    srv.after("READ", csnEntity, async (entity) => FieldControls.calculateFieldControls(csnEntity, configurationEntity, entity));
    srv.after("UPDATE", csnEntity, async (update, req) => {
      const entityName = csnEntity.name.split('.').at(-1);
      const entity = await SELECT.one.from(csnEntity).where({ ID: update.ID })
      const entityWithFCs = FieldControls.calculateFieldControls(csnEntity, configurationEntity, entity);

      const { errors } = FieldControls.validatePayload(req, configurationEntity, entityWithFCs, csnEntity, update);


      errors.forEach(({ fieldName, message }) => {
        req.error({
          target: `/${entityName}(ID='${req.data.ID}')/${fieldName}`,
          message,
          description: message,
          code: 400,
        });
      });

      return req;
    });
  })
});
