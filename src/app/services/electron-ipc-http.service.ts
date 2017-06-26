import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mapTo';

import {Injectable, NgZone} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ElectronService} from 'ngx-electron';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {NoPageError, PageDatabase, StoredPage} from './page-database.service';

@Injectable()
export class ElectronIPCHTTPService {
  constructor(
      private readonly electron: ElectronService,
      private readonly sanitizer: DomSanitizer, private readonly zone: NgZone,
      private readonly pageDb: PageDatabase) {}

  getURL(url: string, cache: boolean = true): Observable<string> {
    console.log('Requesting ' + url + (cache ? ' (with caching)' : ''));
    if (cache) {
      return this.pageDb.getPage(url).map((page) => {
        console.log('Page:' + page);
        if (page === null) {
          console.log('Nothing in cache, manual fetch start.');
          return this.getURLViaIPC(url)
              .do((html) => {
                console.log('Empty cache. Web found: ' + html);
              })
              .map((html) => {
                console.log('Caching html: ' + html);
                const storedPage = new StoredPage();
                storedPage.url = url;
                storedPage.body = html;
                return this.pageDb.storePage(storedPage)
                    .mapTo(Observable.of(html));
              });
        } else {
          return page.body;
        }
      });
    } else {
      return this.getURLViaIPC(url);
    }
  }

  private getURLViaIPC(url: string): Observable<string> {
    const urlHostRegex = /(http|https):\/\/(.*?)(?:\/|$)/i;
    const urlHostMatches = url.match(urlHostRegex);
    const urlHost = urlHostMatches[2];
    const urlProtocol = urlHostMatches[1];
    const urlSubject = new Subject();
    this.electron.ipcRenderer.send('webget', url);
    this.electron.ipcRenderer.once(url, (event, args) => {
      const response = args as Response;
      if (response.status != 200) {
        urlSubject.error(new Error('Non-200 status code: ' + response.status));
      } else {
        const relativeLinksRegex = /(href|background|src)="\//ig;
        const hyperLinksRegex = /href="([^"]*)"/ig;
        const html =
            args.body
                .replace(
                    relativeLinksRegex,
                    (match, g1) => {
                      return g1 + '="' + urlProtocol + '://' + urlHost + '/';
                    })
                .replace(hyperLinksRegex, (match, g1) => {
                  return 'href_old="' + g1 + '"';
                });
        this.zone.run(() => {
          urlSubject.next(html);
        });
      }
    });
    return urlSubject.asObservable();
  }
}
