import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/combineLatest';

import {Component, NgZone, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ElectronService} from 'ngx-electron';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  private readonly querySubject = new BehaviorSubject<string>('');
  private readonly pageNumber = new BehaviorSubject<number>(1);
  pageHTMLRaw: Observable<string>;
  pageHTMLSelected: Observable<SafeHtml>;
  query: '';

  constructor(
      private readonly electron: ElectronService,
      private readonly sanitizer: DomSanitizer, private readonly zone: NgZone) {
  }

  ngOnInit() {
    this.pageHTMLRaw =
        this.pageNumber.asObservable()
            .do((pn) => console.log('Current page number: ' + pn))
            .map(
                (pageNum: number):
                    Observable<string> => {
                      const pageUrl = 'http://www.giantitp.com/comics/oots' +
                          this.toPaddedNumberString(
                              this.pageNumber.getValue()) +
                          '.html';
                      const pageSubject = new Subject<string>();
                      this.electron.ipcRenderer.send('webget', pageUrl);
                      this.electron.ipcRenderer.once(pageUrl, (event, args) => {
                        this.zone.run(() => pageSubject.next(args));
                      });
                      return pageSubject.asObservable();
                    })
            .do(() => console.log('Requested IPC'))
            .switchMap(html => html)
            .do(() => console.log('IPC returned.'))
            .map(
                (html: string):
                    string => {
                      const relativeLinksRegex = /(href|background|src)="\//ig;
                      const hyperLinksRegex = /href="([^"]*)"/ig;
                      return html
                          .replace(
                              relativeLinksRegex,
                              (match, g1) => {
                                return g1 + '="' +
                                    'http://www.giantitp.com/';
                              })
                          .replace(hyperLinksRegex, (match, g1) => {
                            return 'href_old="' + g1 + '"';
                          });
                    })
            .delay(1000)
            .do((str: string) => console.log('Finished parsing raw HTML.'))
            .share();
    const parser = new DOMParser();
    this.pageHTMLSelected = Observable.combineLatest(
        this.querySubject.asObservable().debounceTime(1000), this.pageHTMLRaw,
        (query, pageHTML) => {
          if (query !== '') {
            const parsed = parser.parseFromString(pageHTML, 'text/html');
            const selectedElement = parsed.querySelector(query) as HTMLElement;
            if (selectedElement.children.length > 0) {
              return this.sanitizer.bypassSecurityTrustHtml(
                  selectedElement.innerHTML);
            } else {
              return this.sanitizer.bypassSecurityTrustHtml(
                  selectedElement.parentElement.innerHTML);
            }
          } else {
            console.log('Query is empty, returning whole page.');
            return pageHTML;
          }
        });
  }

  getPage() {
    this.pageNumber.next(this.pageNumber.getValue());
  }

  nextPage() {
    this.pageNumber.next(this.pageNumber.getValue() + 1);
  }

  previousPage() {
    if (this.pageNumber.getValue() > 1) {
      this.pageNumber.next(this.pageNumber.getValue() - 1);
    }
  }

  changeQuery(event) {
    this.querySubject.next(this.query);
  }

  private toPaddedNumberString(num: number): string {
    let str = String(num);
    while (str.length < 4) {
      str = '0' + str;
      }
    return str;
  }
}
