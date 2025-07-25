
/**
 *  Available annotation examples.
 *
 *  @FCSettings.liveValidations: true
 *  @FCSettings.autoErase: true
 *  @FCSettings.path: 'srv/@FCDefinitions/InternalUsersForm.js'
 *  
 * @FCSettings: {
 *      useImpl.BeneficiaryAddress: 'Addresses',
 *      useImpl.DeliveryAddress: 'Addresses',
 *   }
 * or
 * 
 * @FCSettings: {
 *  useImpl: {
 *    BeneficiaryAddress: 'Addresses',
 *    DeliveryAddress: 'Addresses',
 *  }
 * }
 */

/**
 * Cds configs:
 * 
 * "cds": {
 *  "enable:capfc:plugin": true,
 *  "enable:capfc:liveValidations": false,
 *  "enable:capfc:autoErase": false,
 * }
 */

/**
 * Merge logic of configurations should work in the following way
 * Object.assing({}, defaultLibValues, cdsConfiguration, annotationConfiguration, codeCallConfigurations)
 */

const FCSettings = {
  autoErase: cds.env['enable:capfc:autoErase'] ?? true,
  liveValidations: cds.env['enable:capfc:liveValidations'] ?? true,
  useImpl: {}
};

module.exports = FCSettings;
