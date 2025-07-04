using {CatalogService as srv} from './cat-service';

annotate srv.Books with {
  title              @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
  description              @(
    Common.FieldControl: {$value: description_fc},
    Common.Label       : '{i18n>description}'
  );
};
