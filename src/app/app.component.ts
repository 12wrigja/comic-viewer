import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  private readonly pageSubject = new Subject<string>();
  pageHTML: Observable<string>;

  constructor(private readonly electron: ElectronService) {

  }

  ngOnInit(){
    this.pageHTML = this.pageSubject.asObservable();
  }

  getPage() {
    const pageUrl = 'http://www.giantitp.com/comics/oots0001.html';
    this.electron.ipcRenderer.send('webget', pageUrl);
    this.electron.ipcRenderer.once(pageUrl, (event, args) => {
      console.log("Return IPC.");
      console.log(args);
      this.pageSubject.next(args);
    });
  }
}
