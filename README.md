# CAPFC - SAP CAP Field Control Plugin

A SAP CAP plugin that provides dynamic field control functionality for runtime field visibility, editability and validation.

## Quick Start

### 1. Enable Plugin

```json
{
  "cds": {
    "enable:capfc:plugin": true
  }
}
```

### 2. Create Field Control Configuration

Create `srv/@FCDefinitions/MyEntity.js`:

```javascript
const { fieldControlDictionary } = require('capfc');

const fieldControlConfigurations = {
  mandatory: {
    fc: () => fieldControlDictionary.Mandatory
  },
  conditional: {
    fc: (entity) => entity.condition ? 
      fieldControlDictionary.Mandatory : 
      fieldControlDictionary.Hidden
  },
  validated: {
    fc: () => fieldControlDictionary.Mandatory,
    validator: (value, { i18n }) => {
      if (!value || value.length < 5) {
        return i18n.getText('validation.minLength', [5]);
      }
    }
  }
};

module.exports = fieldControlConfigurations;
```

### 3. Configure CDS Service

```cds
service MyService {
  @FCSettings: {
    path: 'srv/@FCDefinitions/MyEntity.js'
  }
  entity MyEntity as projection on my.MyEntity {
    *,
    virtual null as mandatory_fc    : Integer @odata.Type: 'Edm.Byte',
    virtual null as conditional_fc  : Integer @odata.Type: 'Edm.Byte',
    virtual null as validated_fc    : Integer @odata.Type: 'Edm.Byte'
  }
}

annotate MyService.MyEntity with {
  fieldName @(Common.FieldControl: {$value: conditional_fc});
};
```

### 4. Enable Handlers

Create `srv/my-service.js`:

```javascript
const { 
  execAfterREADHandler, 
  execUPDATEHandler, 
  bindEntityHandlers
} = require('capfc');

module.exports = (srv) => {
  const { MyEntity } = srv.entities;

  // Basic handlers
  srv.after('READ', MyEntity, execAfterREADHandler);
  srv.on('UPDATE', MyEntity, execUPDATEHandler);

  // Draft-enabled entity handlers
  if (MyEntity['@odata.draft.enabled']) {
    const { DRAFTPrepareHandler, CreateDraftHandler } = bindEntityHandlers(MyEntity);

    srv.on('NEW', MyEntity.drafts, CreateDraftHandler);
    srv.after('READ', MyEntity.drafts, execAfterREADHandler);
    srv.on('UPDATE', MyEntity.drafts, execUPDATEHandler);
  }
};
```

## Configuration

### Environment Variables

```json
{
  "cds": {
    "enable:capfc:plugin": true,
    "enable:capfc:liveValidations": true,
    "enable:capfc:autoErase": true,
    "enable:capfc:defaultFCValue": 3,
    "enable:capfc:blockUnannotatedValueChanges": true
  }
}
```

### Core Functions

#### `validateAndThowErrorsIfExists(req, dataForValidation, targetPrefix)`
Validates data and throws errors if validation fails.

```javascript
const { validateAndThowErrorsIfExists } = require('capfc');

srv.on('UPDATE', MyEntity, async (req, next) => {
  await validateAndThowErrorsIfExists(req, req.data, 'in');
  return await next();
});
```

#### `validateWithFCs(req, dataForValidation)`
Validates data and returns validation errors.

```javascript
const { validateWithFCs } = require('capfc');

const errors = await validateWithFCs(req, req.data);

validateAndAddMyMessage(errors);

if (errors.length > 0) {
  errors.forEach(error => {
    req.error({
      target: `/MyEntity(${req.params.at(0).ID})/${error.fieldName}`,
      message: error.message,
      code: 400
    });
  });
  req.reject();
}
```

#### `calculateFieldControls(data, req, { csnEntity, context = {} })`
Calculates field control values for entities.

```javascript
const { calculateFieldControls } = require('capfc');

const entityWithFCs = await calculateFieldControls(entity, req, { 
  csnEntity: MyEntity, // optional, req.target will be used by default
  context: { additionalData: 'value' }
});
```

#### `execAfterREADHandler(entity, req, context)`
Executes READ handler for field control calculation.

```javascript
const { execAfterREADHandler } = require('capfc');

srv.after('READ', MyEntity, execAfterREADHandler);
```

#### `execUPDATEHandler(req, next, context)`
Executes UPDATE handler with field control validation.

```javascript
const { execUPDATEHandler } = require('capfc');

srv.on('UPDATE', MyEntity, execUPDATEHandler);
```


#### `Utils`
```javascript
const { Utils } = require('capfc');

const message = Utils.getText('validation.required', ['dynamic field value']);
const entityName = Utils.getEntityName(csnEntity);
const i18n = Utils.getBoundI18nBundle();
```