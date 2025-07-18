const Utils = require('./Utils');
const symbolHelper = require('./SymbolHelper');

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
 * @param {Object} helperContext - Helper context
 * @returns {number|boolean} Field control value
 */
function calculateFieldControl(calculator, entity, helperContext) {
  if (!calculator) {
    return fieldControlDictionary.ReadOnly;
  }

  return calculator(entity, helperContext);
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
        const isMandatory = cdsDefinition['@mandatory'];
        const fieldControlValuePath = fieldControlAnnotation['='];
        const fcValue =
          data[fieldControlValuePath] ||
          (isMandatory && fieldControlDictionary.Mandatory) ||
          fieldControlDictionary.Optional;

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

function getEntityFCAnnotationsMapping(entityDefinitionElements) {
  const { elements } = entityDefinitionElements;

  const settings = Object.entries(elements).reduce((acc, [fieldName, element]) => {
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
  /**
   * @param {object} srv - SRV Definition
   * @param {object} csnEntity - CSN Entity Definition
   * @param {object} configurationEntity - Field Control configurations
   */
  constructor(srv, csnEntity, configurationEntity, configuration) {
    this.configuration = configuration;
    this.srv = srv;
    this.csnEntity = csnEntity;
    this.configurationEntity = configurationEntity;
  }

  async callOnBeforeSave(updatedEntry, updateData) {
    const onBeforeSave = symbolHelper.getOnBeforeSave(this.configurationEntity);

    if (onBeforeSave) {
      onBeforeSave(updatedEntry, updateData, this.buildHelperObject());
    }
  }

  async callOnBeforeCalculateFC(updatedEntry, updateData) {
    const onBeforeCalculateFC = symbolHelper.getOnBeforeCalculateFC(this.configurationEntity);

    if (onBeforeCalculateFC) {
      return onBeforeCalculateFC(updatedEntry, updateData, this.buildHelperObject());
    }
  }

  buildHelperObject() {
    return { srv: this.srv, context: {} };
  }

  eraseUnavailableDynamicFields(updatedEntry, updateData) {
    Object.entries(this.configurationEntity).reduce(
      (requests, [fieldName]) => {
        const fcValue = updatedEntry[`${fieldName}_fc`];
        const fieldDefinition = this.csnEntity.elements[fieldName];

        if (!fieldDefinition) {
          return requests;
        }

        const finalFieldName =
          fieldDefinition.type === 'cds.Association'
            ? fieldDefinition.$generatedForeignKeys.at(0)
            : fieldName;

        if (fcValue <= fieldControlDictionary.ReadOnly) {
          updateData[finalFieldName] = null;
        }

        return requests;
      },
      []
    );
  }

  /**
   * Validates payload against field control configurations
   * @param {Object} req - Request
   * @param {Object} data - The data to validate
   * @param {Object} dataUpdate - The data update to validate against
   * @returns {Object} Validation results containing any errors
   */
  validatePayload(req, data, dataUpdate) {
    const i18n = Utils.getBoundI18nBundle(req);

    const fielControlAnnotationValues = getFieldControlValues(data, this.csnEntity, i18n);

    const validationResults = Object.entries(dataUpdate).reduce(
      (acc, [key, entityValue]) => {
        const { validator } = this.configurationEntity[key] || {};
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

        if (fcValue <= fieldControlDictionary.ReadOnly && dataUpdate[key]) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('capfc.validation.message.readOnly', [label])
          });
        }

        if (entityValue === null && fcValue === fieldControlDictionary.Mandatory) {
          acc.errors.push({
            fieldName: key,
            message: i18n.getText('capfc.validation.message.required', [label])
          });
        }

        return acc;
      },
      { errors: [] }
    );

    return validationResults;
  }

  async calculateAssociatedEntitiesFC(entity) {
    const requests = Object.entries(this.configuration.useImpl).map(async ([associationName, targetSrvEntity]) => {
      const record = entity[associationName];

      if (!record) {
        return;
      }

      const fc = symbolHelper.getEntitityFCs(this.srv)[targetSrvEntity];
      
      return await fc.calculateFieldControls(record);
    });

    return await Promise.all(requests);
  }

  /**
   * Calculate field controls for an Entity or array of Entities
   * @param {Object|Array} entities - Single entity or array of entities
   * @returns {Object|Array} Entity/Entities with field controls
   */
  async calculateFieldControls(entities) {
    if (!entities) {
      return entities;
    }

    const entitiesArray = Array.isArray(entities)
      ? entities
      : [entities];

    const processEntitiesRequests = entitiesArray.map(async (entity) => {
      const helperObject = this.buildHelperObject();

      await this.calculateAssociatedEntitiesFC(entity);

      await this.callOnBeforeCalculateFC(entity, helperObject);

      const entityFCsSettings = getEntityFCAnnotationsMapping(this.csnEntity);
      const fieldControls = Object.values(entityFCsSettings).reduce(
        (fcAcc, { fieldName, FCPath }) => {
          if (fcAcc.hasOwnProperty(FCPath)) {
            return fcAcc;
          }

          const fcValue = calculateFieldControl(this.configurationEntity[fieldName]?.fc, entity, helperObject);

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

    const processedEntities = await Promise.all(processEntitiesRequests);

    return Array.isArray(entities)
      ? processedEntities
      : processedEntities[0];
  }
}

module.exports = {
  FieldControls,
  fieldControlDictionary,
  handlers: {
    setOnBeforeSave: symbolHelper.setOnBeforeSave,
    setOnBeforeCalculateFC: symbolHelper.setOnBeforeCalculateFC
  }
};
