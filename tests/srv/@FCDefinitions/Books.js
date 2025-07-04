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

const fieldControlConfigurations = {
    title: {
        fc: () => fieldControlDictionary.Mandatory,
        validator(value, { i18n }) {
            if (!value || value.length < 10) {
                return i18n.getText(
                    'book.validation.title.minLength'
                );
            }
        },
        onBeforeSave(entity, entityChanges) { },
    },
    description: {
        fc: (book) => book.enableDetails ? fieldControlDictionary.Mandatory : fieldControlDictionary.Hidden,
    }
};

module.exports = fieldControlConfigurations;
