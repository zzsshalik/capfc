const defaultAnnotationValues = require('./defaultAnnotationValues');

function extractFCSettings(annotations) {
  if (!annotations) {
    return null;
  }

  const FCSettings = {};

  for (const [key, value] of Object.entries(annotations)) {
    if (key.startsWith('@FCSettings.')) {
      const path = key.slice('@FCSettings.'.length).split('.');
      let current = FCSettings;

      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!(segment in current)) {
          current[segment] = {};
        }
        current = current[segment];
      }

      current[path[path.length - 1]] = value;
    }
  }

  // Merge with default values (if needed)
  return Object.keys(FCSettings).length > 0
    ? { ...structuredClone(defaultAnnotationValues), ...FCSettings }
    : null;
}

module.exports = class ServiceParser {
  static onEachFCEntity(services, callback) {
    for (const srv of services) {
      if (srv instanceof cds.ApplicationService) {
        Object.values(srv.entities).forEach((entity) => {
          const FCSettings = extractFCSettings(entity?.$flatAnnotations);

          FCSettings && FCSettings.path && callback(srv, entity, FCSettings);
        });
      }
    }
  }
};
