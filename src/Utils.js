/**
 * Replaces placeholders like {0}, {1}, etc. in the message string
 * with corresponding values from the args array.
 *
 * @param {string} msg - The message template containing placeholders.
 * @param {Array} args - The values to replace the placeholders with.
 * @returns {string} The formatted message string.
 */
function formatMessage(msg, args) {
  return args.reduce((result, val, i) => result.replace(`{${i}}`, val), msg);
}

module.exports = class Utils {
  static getEntityName(csnEntity) {
    return csnEntity.name.split('.').at(-1);
  }

  /**
   * Retrieves a localized text for a given key and replaces placeholders with provided arguments.
   * https://cap.cloud.sap/docs/node.js/cds-i18n#texts4-locale
   * @param {string} key - The i18n key to look up in the text bundle.
   * @param {Array} [args=[]] - An optional array of values to replace placeholders in the text (e.g. {0}, {1}).
   * @returns {string} The localized and formatted message string.
   */
  static getText(key, args) {
    const locale = cds.context.locale || 'en';
    const bundle = cds.i18n.bundle4();
    const texts = bundle.texts4(locale);
    const msg = texts[key] || key;
    return formatMessage(msg, args || []);
  }

  /**
   * Retrieves a localized i18n text bundle instance bound to the given request's locale.
   *
   * @param {Request} [req=cds.context] - The CDS request context containing locale information.
   * @returns {TextBundle} The localized TextBundle instance.
   */
  static getBoundI18nBundle() {
    return {
      getText: (...args) => Utils.getText(...args),
    };
  }
};
