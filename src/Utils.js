const { TextBundle } = require('@sap/textbundle');
const path = require("path");

const bundlePath = path.join(path.resolve("./srv"), "_i18n", "i18n");

module.exports = class Utils {
  /**
   * Retrieves a localized i18n text bundle instance bound to the given request's locale.
   *
   * @param {import('@sap/cds/common').Request} [req=cds.context] - The CDS request context containing locale information.
   * @returns {import('@sap/text-bundle').TextBundle} The localized TextBundle instance.
   */
  static getBoundI18nBundle(req) {
    return new TextBundle(bundlePath, req.locale);
  }

  /**
   * @param {String} sKey Key text
   * @returns {String} i18n Text value
   */
  static getText(sKey) {
    return Utils.getBoundI18nBundle().getText(sKey);
  }
};
