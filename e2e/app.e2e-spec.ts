import { ComicBooksPage } from './app.po';

describe('comic-books App', () => {
  let page: ComicBooksPage;

  beforeEach(() => {
    page = new ComicBooksPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
