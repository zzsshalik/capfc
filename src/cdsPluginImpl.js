const path = require('path');
const ServiceParser = require('./ServiceParser.js');
const { FieldControls } = require('./FieldControls.js');
const Utils = require('./Utils.js');
const { setEntityFC, addSrvEntitiesFCs } = require('./SymbolHelper');
const { bindHandles } = require('./Handlers');

module.exports = function (service) {
  const services = Array.isArray(service) ? service : [service];

  ServiceParser.onEachFCEntity(services, async (srv, csnEntity, configuration) => {
    const entityName = Utils.getEntityName(csnEntity);
    const configurationFilePath = path.resolve('./', configuration.path);

    const configurationEntity = require(configurationFilePath);

    const fc = new FieldControls(srv, csnEntity, configurationEntity, configuration);

    setEntityFC(csnEntity, fc);
    addSrvEntitiesFCs(srv, { [entityName]: fc });

    const {
      UPDATEHandler,
      DRAFTPrepareHandler,
      READHandler,
      CreateDraftHandler
    } = bindHandles(fc);

    // --------
    // srv.on('draftActivate', csnEntity.drafts, (req) => {
    //   console.log(req);
    // });
    // --------

    // srv.on('CREATE', csnEntity, (req, next) => {
    //   console.log(req, next)
    // });
    // if (csnEntity['@odata.draft.enabled']) {
    //   if (csnEntity['@odata.draft.bypass']) {
    //     srv.after('READ', csnEntity, READHandler);
    //     srv.on('UPDATE', csnEntity, UPDATEHandler);
    //   } else {
    //     srv.on('draftPrepare', DRAFTPrepareHandler);
    //     srv.on('NEW', csnEntity.drafts, CreateDraftHandler);
    //     srv.after('READ', csnEntity.drafts, READHandler);
    //     srv.on('UPDATE', csnEntity.drafts, UPDATEHandler);
    //   }

    // } else {
    //   srv.after('READ', csnEntity, READHandler);
    //   srv.on('UPDATE', csnEntity, UPDATEHandler);
    // }
  });
};
