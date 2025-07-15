function extractFCSettings(annotations) {
  if (!annotations) {
    return null;
  }

  const FCSettings = {};

  for (const [ key, value ] of Object.entries(annotations)) {
    if (key.startsWith('@FCSettings.')) {
      const prop = key.slice('@FCSettings.'.length);

      FCSettings[prop] = value;
    }
  }

  return Object.keys(FCSettings).length > 0 ? FCSettings : null;
}

module.exports = class ServiceParser {
  static onEachFCEntity(services, callback) {
    for (const srv of services) {
      if (srv instanceof cds.ApplicationService) {
        Object.values(srv.entities).forEach((entity) => {
          const FCSettings = extractFCSettings(entity?.$flatAnnotations);

          FCSettings && callback(srv, entity, FCSettings);
        });
      }
    }
  }
};
