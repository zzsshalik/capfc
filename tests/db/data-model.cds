namespace my.bookshop;

entity Books {
  key ID            : UUID;
      title         : String;
      enableDetails : Boolean;
      description   : String;
      stock         : Integer;
      reorderPoint  : Integer;
      releaseDate   : Date;
      previewDate   : Date;
      statusCode    : String;
      price         : Integer;
      to_Chapters   : Composition of many Chapters
                        on to_Chapters.to_Books = $self
}

entity Chapters {
  key ID       : UUID;
      title    : String;
      to_Books : Association to Books
}
