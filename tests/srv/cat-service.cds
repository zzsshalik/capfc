using my.bookshop as my from '../db/data-model';


service CatalogService {
    @FCSettings: {
        path: 'srv/@FCDefinitions/Books.js',
        defaultFC: 3
    }
    entity Books    as
        projection on my.Books {
            *,
            virtual null as title_fc       : Integer @odata.Type: 'Edm.Byte',
            virtual null as description_fc : Integer @odata.Type: 'Edm.Byte',
        };

    entity Chapters as projection on my.Chapters;
}
