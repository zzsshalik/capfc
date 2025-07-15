const Utils = require('./Utils');

/**
 * https://sap.github.io/odata-vocabularies/vocabularies/Common.html#FieldControlType
 * Field control value constants
 * These values determine the visibility and editability of fields
 */
const fieldControlDictionary = {

  // Visible, Editable, Required
  Mandatory: 7,

  // Visible, Editable, Not Required
  Optional: 3,

  // Visible, Not Editable
  ReadOnly: 1,

  // Not Visible
  Hidden: 0
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
    (acc, [ key, cdsDefinition ]) => {
      const fieldControlAnnotation = cdsDefinition['@Common.FieldControl'];
      const label = cdsDefinition['@Common.Label'];

      if (fieldControlAnnotation) {
        const fieldControlValuePath = fieldControlAnnotation['='];
        const fcValue =
          data[fieldControlValuePath] || fieldControlDictionary.Hidden;

        acc[key] = {
          label: i18n.getText(label.replace('{i18n>', '').replace('}', '')),
          fcValue
        };

        return acc;
      }

      return acc;
    },
    {}
  );
}

/**
 * Returns field control value by binding path
 * @param {Object} record Head record
 * @param {string} annotationBindingPath Annotation binding path
 * @returns {Decimal | null} Decimal Value or null
 */
// function getFieldControlValue(record, annotationBindingPath) {
//   if (!annotationBindingPath) {
//     return null;
//   }

//   const fixedPathParts = annotationBindingPath.replace('_it.', '').split('.');
//   let tail = record;

//   fixedPathParts.forEach((itemStringKey) => {
//     const tailValue = tail && tail[itemStringKey];

//     tail = tailValue;
//   });

//   return tail;
// }

//
// @param {Object} rootFcEntity Root Entity with Field Control values
// @param {Object} entityDefinitionElements Action CDS definition
// @param {string} fieldName Field name
// @returns {object} Field Information
//
// function fieldInfoInEntity(rootFcEntity, entityDefinitionElements, fieldName) {
//   const fieldConfig = entityDefinitionElements[fieldName] || {};
//   const fieldControlConfig = fieldConfig['@Common.FieldControl'];
//   const { '=': fieldControlBindingPath, '#': fieldControlMandatory } = fieldControlConfig || {};
//   const fieldControlValue = getFieldControlValue(rootFcEntity, fieldControlBindingPath);

//   const mandatoryShouldBeIgnored = [ 'cds.Association', 'cds.Composition' ].includes(fieldConfig.type);
//   const editableShouldBeIgnored = mandatoryShouldBeIgnored || fieldConfig.virtual;

//   return {
//     mandatory: mandatoryShouldBeIgnored ? false : fieldControlMandatory || (fieldControlValue === fieldControlDictionary.Mandatory),
//     editable: editableShouldBeIgnored ? false : fieldControlMandatory || (fieldControlValue >= fieldControlDictionary.Optional)
//   };
// }

function getEntityFCSettings(entityDefinitionElements) {
  const { elements } = entityDefinitionElements;

  const settings = Object.entries(elements).reduce((acc, [ fieldName, element ]) => {
    const elementFC = element['@Common.FieldControl'];
    const { '=': fieldControlBindingPath } = elementFC || {};

    if (fieldControlBindingPath) {
      acc[fieldName] = { fieldName, FCPath: fieldControlBindingPath };
    }

    return acc;
  }, {});

  return settings;
}

/**
 * FieldControls class to handle the logic for field control values
 * based on different conditions in the request or entity data
 */
class FieldControls {
  // static async calculateDynamicFields(
  //   csnEntityDefinition,
  //   FCConfigurations,
  //   updatedEntry,
  //   updateData
  // ) {
  //   const requests = Object.entries(FCConfigurations).reduce(
  //     (requests, [fieldName, { onBeforeSave }]) => {
  //       const fcValue = updatedEntry[`${fieldName}_fc`];
  //       const fieldDefinition = csnEntityDefinition.elements[fieldName];
  //       if (!fieldDefinition) {
  //         return requests;
  //       }
  //       const finalFieldName =
  //         fieldDefinition.type === 'cds.Association'
  //           ? fieldDefinition['$generatedForeignKeys'].at(0)
  //           : fieldName;
  //       if (fcValue <= fieldControlDictionary.ReadOnly) {
  //         updateData[finalFieldName] = null;
  //       }

  //       if (onBeforeSave) {
  //         requests.push(onBeforeSave(updatedEntry, updateData));
  //       }

  //       return requests;
  //     },
  //     []
  //   );

  //   return await Promise.all(requests);
  // }

  /**
   * Validates payload against field control configurations
   * @param {Object} req - Request
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
      (acc, [ key, entityValue ]) => {
        const { validator } = FCConfigurations[key] || {};
        const { fcValue, label } = fielControlAnnotationValues[key] || {};

        if (validator && fcValue >= fieldControlDictionary.Optional) {
          const validationMessage = validator(entityValue, {
            i18n,
            entity: data
          });

          validationMessage &&
            acc.errors.push({
              fieldName: key,
              message: validationMessage
            });
        }

        if (
          fcValue <= fieldControlDictionary.ReadOnly &&
          dataUpdate[key]
        ) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('validation.message.readOnly', [ label ])
          });
        }
        if (
          entityValue === null &&
          fcValue === fieldControlDictionary.Mandatory
        ) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('validation.message.required', [ label ])
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
   * @param {object} csnEntity - CSN Entity Definition
   * @param {object} fieldControlConfigurations - Field Control configurations
   * @param {Object|Array} entities - Single entity or array of entities
   * @returns {Object|Array} Entity/Entities with field controls
   */
  static calculateFieldControls(csnEntity, fieldControlConfigurations, entities) {
    if (!entities) {
      return entities;
    }

    const entitiesArray = Array.isArray(entities)
      ? entities
      : [ entities ];

    const processedEntities = entitiesArray.map((entity) => {
      const entityFCsSettings = getEntityFCSettings(csnEntity);
      const fieldControls = Object.values(entityFCsSettings).reduce(
        (fcAcc, { fieldName, FCPath }) => {
          const fcValue = calculateFieldControl(fieldControlConfigurations[fieldName].fc, entity);

          if (fcValue !== null) {
            fcAcc[FCPath] = fcValue;
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
  fieldControlDictionary
};
