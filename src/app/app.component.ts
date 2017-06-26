import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/never';

import {Component, NgZone, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';

import {ElectronIPCHTTPService} from './services/electron-ipc-http.service';

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
  useCache = false;

  constructor(
      private readonly ipcHTTP: ElectronIPCHTTPService,
      private readonly sanitizer: DomSanitizer, private readonly zone: NgZone) {
  }

  ngOnInit() {
    this.pageHTMLRaw =
        this.pageNumber.asObservable()
            .do((pn) => console.log('Current page number: ' + pn))
            .switchMap(
                (pageNum: number):
                    Observable<string> => {
                      const pageUrl = 'http://www.giantitp.com/comics/oots' +
                          this.toPaddedNumberString(
                              this.pageNumber.getValue()) +
                          '.html';
                      return this.ipcHTTP.getURL(pageUrl, this.useCache);
                    })
            .share();
    const parser = new DOMParser();
    this.pageHTMLSelected =
        Observable
            .combineLatest(
                this.querySubject.asObservable().debounceTime(1000),
                this.pageHTMLRaw,
                (query, pageHTML) => {
                  if (query !== '') {
                    const parsed =
                        parser.parseFromString(pageHTML, 'text/html');
                    const selectedElement =
                        parsed.querySelector(query) as HTMLElement;
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
                })
            .share();
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

  toggleCache() {
    this.useCache = !this.useCache;
  }

  private toPaddedNumberString(num: number): string {
    let str = String(num);
    while (str.length < 4) {
      str = '0' + str;
    }
    return str;
  }
}
