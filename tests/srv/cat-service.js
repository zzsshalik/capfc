const cds = require('@sap/cds');

class CatalogService extends cds.ApplicationService {
    init() {
        this.on('READ', 'Books', this.onReadBooks);
        this.on("UPDATE", 'Books', this.onUpdateBooks);
        return super.init();
    }

    async onUpdateBooks(req, next){
        return await next();
    }

    async onReadBooks(req, next) {
        const books = await next();
        const isArray = Array.isArray(books);

        function calculate(entries) {
            const items = isArray ? entries : [entries];

            items.forEach(element => {
                element.test = 'hello';
            });

            return isArray ? items : items.at(0);
        }


        return calculate(books);
    }
}

module.exports = CatalogService;
