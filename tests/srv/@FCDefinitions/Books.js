const { fieldControlDictionary } = require('capfc');

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
