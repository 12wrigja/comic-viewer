import 'rxjs/add/observable/of';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export class StoredPage {
  url: string;
  body: string;
  imageUrl: string;
}

export class NoPageError extends Error {}

export class PageDatabase {
  constructor() {}

  getPage(url: string): Observable<StoredPage|null> {
    return this.openPagesDatabase().switchMap((db: IDBDatabase) => {
      const pageSubject = new Subject<StoredPage>();
      const transaction: IDBTransaction = db.transaction(['pages'], 'readonly');
      const table = transaction.objectStore('pages');
      const request = table.get(url);
      request.onsuccess = (event: any) => {
        const sp = event.target.result as StoredPage;
        console.log(event.target.result);
        if (sp !== undefined) {
          pageSubject.next(event.target.result as StoredPage);
        } else {
          pageSubject.next(null);
        }
      };
      return pageSubject.asObservable();
    });
  }

  storePage(page: StoredPage): Observable<void> {
    return this.openPagesDatabase().flatMap((db: IDBDatabase) => {
      console.log('Let\'s try writing!');
      const writeTransactionSubject = new Subject<void>();
      const writeTransaction = db.transaction(['pages'], 'readwrite');
      const writeRequest = writeTransaction.objectStore('pages').put(page);
      writeRequest.onerror = (event) => {
        console.log('Error writing page ' + page.url + ' to cache.');
        writeTransactionSubject.error(
            new Error('Unable to store page in cache.'));
      };
      writeRequest.onsuccess = (event) => {
        console.log('Write for page ' + page.url + ' successful.');
        writeTransactionSubject.complete();
      };
      return writeTransactionSubject.asObservable();
    });
  }
  //   const openDbRequest = window.indexedDB.open('comicDb');
  //   openDbRequest.onerror = (event) => {
  //     pageSubject.error(new Error('Unable to open comicDb.'));
  //   };
  //   openDbRequest.onupgradeneeded = (event: any) => {
  //     const db: IDBDatabase = event.target.result;
  //     db.onerror = function(event) {
  //       pageSubject.error(new Error('Error upgrading comicDb'));
  //     };
  //     var objStore = db.createObjectStore('pages', {'keyPath': 'url'});
  //   };
  //   openDbRequest.onsuccess = (event: any) => {
  //     const db: IDBDatabase = event.target.result;
  //     const transaction: IDBTransaction =
  //         db.transaction(['pages'], 'readonly');
  //     const table = transaction.objectStore('pages');
  //     const request = table.get(url);
  //     request.onsuccess = (event: any) => {
  //       if (event.target.result === undefined) {
  //         console.log('URL ' + url + ' not found in cache.');
  //         this.getURLViaIPC(url).subscribe((html) => {
  //           pageSubject.next(html);
  //           const storedPage = new StoredPage();
  //           storedPage.url = url;
  //           storedPage.body = html;
  //
  //           };
  //         });
  //       } else {
  //         console.log('Found something in cache for url' + url);
  //         console.log(event);
  //         urlSubject.next(event.target.result);
  //       }
  //     };
  //     return pageSubject.asObservable();

  private openPagesDatabase(): Observable<IDBDatabase> {
    const databaseConnectionSubject = new Subject<IDBDatabase>();
    const openDbRequest = window.indexedDB.open('comicDb');
    openDbRequest.onerror = (event) => {
      console.log('Error connecting to indexeded');
      databaseConnectionSubject.error(new Error('Unable to open comicDb.'));
    };
    openDbRequest.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      db.onerror = function(event) {
        console.log('Error upgrading to indexeded');
        databaseConnectionSubject.error(new Error('Error upgrading comicDb'));
      };
      var objStore = db.createObjectStore('pages', {'keyPath': 'url'});
      databaseConnectionSubject.next(db);
    };
    openDbRequest.onsuccess = (event: any) => {
      const db: IDBDatabase = event.target.result;
      databaseConnectionSubject.next(db);
    };
    return databaseConnectionSubject.asObservable();
  }
}