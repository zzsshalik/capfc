using {CatalogService as srv} from './cat-service';

annotate srv.Books with {
  title       @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
  description @(
    Common.FieldControl: {$value: description_fc},
    Common.Label       : '{i18n>description}'
  );
};

annotate srv.Request with {
  title       @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
};

annotate srv.Details with {
  title       @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
};


annotate srv.Authors with {
  name       @(
    Common.FieldControl: {$value: name_fc},
    Common.Label       : '{i18n>name}'
  );
};

