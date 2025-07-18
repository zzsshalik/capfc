
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
const FCSettings = {
  autoErase: true,
  liveValidations: true,
  useImpl: {}
};

module.exports = FCSettings;
