/**
 * Replaces placeholders like {0}, {1}, etc. in the message string
 * with corresponding values from the args array.
 *
 * @param {string} msg - The message template containing placeholders.
 * @param {Array} args - The values to replace the placeholders with.
 * @returns {string} The formatted message string.
 */
function formatMessage(msg, args) {
  return args.reduce((result, val, i) => {
    return result.replace(`{${i}}`, val);
  }, msg);
}

module.exports = class Utils {
  /**
   * Retrieves a localized text for a given key and replaces placeholders with provided arguments.
   *
   * @param {object} req - The CAP request object containing the locale information.
   * @param {string} key - The i18n key to look up in the text bundle.
   * @param {Array} [args=[]] - An optional array of values to replace placeholders in the text (e.g. {0}, {1}).
   * @returns {string} The localized and formatted message string.
   */
  static getText(req, key, args) {
    const locale = req.locale || 'en';
    const bundle = cds.i18n.bundle4();
    const texts = bundle.texts4(locale);
    const msg = texts[key] || key
    return formatMessage(msg, args || []);
  }

  /**
   * Retrieves a localized i18n text bundle instance bound to the given request's locale.
   *
   * @param {import('@sap/cds/common').Request} [req=cds.context] - The CDS request context containing locale information.
   * @returns {import('@sap/text-bundle').TextBundle} The localized TextBundle instance.
   */
  static getBoundI18nBundle(req) {
    return {
      getText: (...args) => Utils.getText(req, ...args),
    };
  }
};
