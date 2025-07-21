const actions = {
  onBeforeSave: Symbol('onBeforeSave'),
  onAfterSave: Symbol('onAfterSave'),
  setOnBeforeCalculateFC: Symbol('setOnBeforeCalculateFC'),
  srvEntitiesFC: Symbol('srvEntitiesFC'),
  entityFC: Symbol('entityFC')
}

function setOnBeforeSave(obj, handler) {
  obj[actions.onBeforeSave] = handler;
}

function getOnBeforeSave(obj) {
  return obj[actions.onBeforeSave];
}

function getOnAfterSave(obj) {
  return obj[actions.onAfterSave];
}

function setOnAfterSave(obj, handler) {
  obj[actions.onAfterSave] = handler;
}

function setOnBeforeCalculateFC(obj, handler) {
  obj[actions.setOnBeforeCalculateFC] = handler;
}

function getOnBeforeCalculateFC(obj) {
  return obj[actions.setOnBeforeCalculateFC];
}

function setEntityFC(obj, handler) {
  obj[actions.entityFC] = handler;
}

function getEntityFC(obj) {
  return obj[actions.entityFC];
}

function getSrvEntitiesFCs(obj) {
  return obj[actions.srvEntitiesFC];
}

function addSrvEntitiesFCs(obj, handler) {
  const reference = obj[actions.srvEntitiesFC];

  if (!reference) {
    obj[actions.srvEntitiesFC] = handler;
  } else {
    Object.assign(reference, handler);
  }
}


module.exports = {
  setOnBeforeSave,
  getOnBeforeSave,
  setOnBeforeCalculateFC,
  getOnBeforeCalculateFC,

  getSrvEntitiesFCs,
  addSrvEntitiesFCs,

  getOnAfterSave,
  setOnAfterSave,

  setEntityFC,
  getEntityFC
};