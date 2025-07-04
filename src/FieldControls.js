const Utils = require('./Utils');

/**
 * https://sap.github.io/odata-vocabularies/vocabularies/Common.html#FieldControlType
 * Field control value constants
 * These values determine the visibility and editability of fields
 */
const fieldControlDictionary = {
  Mandatory: 7, // Visible, Editable, Required
  Optional: 3, // Visible, Editable, Not Required
  ReadOnly: 1, // Visible, Not Editable
  Hidden: 0, // Not Visible
};

/**
 * Calculate field control for a specific field based on entity
 * @param {function} calculator - function which calculates FC value
 * @param {Object} entity - Entity data
 * @returns {number|boolean} Field control value
 */
function calculateFieldControl(calculator, entity) {
  if (!calculator) {
    return fieldControlDictionary.ReadOnly;
  }

  return calculator(entity);
}

/**
 * Gets field control values from data object and entity CSN definition
 * @param {Object} data - The data object
 * @param {Object} csnEntityDefinition - The CSN entity definition
 * @param {Object} i18n - The i18n bundle
 * @returns {Object} Object containing field control values and labels
 */
function getFieldControlValues(data, csnEntityDefinition, i18n) {
  return Object.entries(csnEntityDefinition.elements).reduce(
    (acc, [key, cdsDefinition]) => {
      const fieldControlAnnotation = cdsDefinition['@Common.FieldControl'];
      const label = cdsDefinition['@Common.Label'];

      if (fieldControlAnnotation) {
        const fieldControlValuePath = fieldControlAnnotation['='];
        const fcValue =
          data[fieldControlValuePath] || fieldControlDictionary.Hidden;

        acc[key] = {
          label: i18n.getText(label.replace('{i18n>', '').replace('}', '')),
          fcValue,
        };

        return acc;
      }
      return acc;
    },
    {}
  );
}

/**
 * FieldControls class to handle the logic for field control values
 * based on different conditions in the request or entity data
 */
class FieldControls {
  static async calculateDynamicFields(
    csnEntityDefinition,
    FCConfigurations,
    updatedEntry,
    updateData
  ) {
    const requests = Object.entries(FCConfigurations).reduce(
      (requests, [fieldName, { onBeforeSave }]) => {
        const fcValue = updatedEntry[`${fieldName}_fc`];
        const fieldDefinition = csnEntityDefinition.elements[fieldName];
        if (!fieldDefinition) {
          return requests;
        }
        const finalFieldName =
          fieldDefinition.type === 'cds.Association'
            ? fieldDefinition['$generatedForeignKeys'].at(0)
            : fieldName;
        if (fcValue <= fieldControlDictionary.ReadOnly) {
          updateData[finalFieldName] = null;
        }

        if (onBeforeSave) {
          requests.push(onBeforeSave(updatedEntry, updateData));
        }

        return requests;
      },
      []
    );

    return await Promise.all(requests);
  }

  /**
   * Validates payload against field control configurations
   * @param {Object} FCConfigurations - Field control configurations
   * @param {Object} data - The data to validate
   * @param {Object} csnEntityDefinition - The CSN entity definition
   * @param {Object} dataUpdate - The data update to validate against
   * @returns {Object} Validation results containing any errors
   */
  static validatePayload(
    req,
    FCConfigurations,
    data,
    csnEntityDefinition,
    dataUpdate
  ) {
    const i18n = Utils.getBoundI18nBundle(req);

    const fielControlAnnotationValues = getFieldControlValues(
      data,
      csnEntityDefinition,
      i18n
    );

    const validationResults = Object.entries(dataUpdate).reduce(
      (acc, [key, entityValue]) => {
        const { validator } = FCConfigurations[key] || {};
        const { fcValue, label } = fielControlAnnotationValues[key] || {};

        if (validator && fcValue >= fieldControlDictionary.Optional) {
          const validationMessage = validator(entityValue, {
            i18n,
            entity: data,
          });

          validationMessage &&
            acc.errors.push({
              fieldName: key,
              message: validationMessage,
            });
        }

        if (
          fcValue <= fieldControlDictionary.ReadOnly &&
          dataUpdate[key]
        ) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('validation.message.readOnly', [label]),
          });
        }
        if (
          entityValue === null &&
          fcValue === fieldControlDictionary.Mandatory
        ) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('validation.message.required', [label]),
          });
        }

        return acc;
      },
      { errors: [] }
    );

    return validationResults;
  }

  /**
   * Calculate field controls for an Entity or array of Entities
   * @param {object} fieldControlConfigurations - Field Control configurations
   * @param {Object|Array} entities - Single entity or array of entities
   * @returns {Object|Array} Entity/Entities with field controls
   */
  static calculateFieldControls(fieldControlConfigurations, entities) {
    if (!entities) {
      return entities;
    }

    const entitiesArray = Array.isArray(entities)
      ? entities
      : [entities];

    const processedEntities = entitiesArray.map(entity => {
      const fieldControls = Object.entries(fieldControlConfigurations).reduce(
        (fcAcc, [fieldName, { fc }]) => {
          const fcValue = calculateFieldControl(fc, entity);
          if (fcValue !== null) {
            fcAcc[`${fieldName}_fc`] = fcValue;
          }
          return fcAcc;
        },
        {}
      );

      Object.assign(entity, fieldControls);

      return entity;
    });

    return Array.isArray(entities)
      ? processedEntities
      : processedEntities[0];
  }
}

module.exports = {
  FieldControls,
  fieldControlDictionary,
};
