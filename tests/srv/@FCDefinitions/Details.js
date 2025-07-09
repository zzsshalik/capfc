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
        }
    }
};

module.exports = fieldControlConfigurations;
