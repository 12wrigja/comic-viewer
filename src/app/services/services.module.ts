import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgxElectronModule} from 'ngx-electron';

import {ElectronIPCHTTPService} from './electron-ipc-http.service';
import {PageDatabase} from './page-database.service';

@NgModule({
  imports: [
    NgxElectronModule,
    BrowserModule,
  ],
  providers: [ElectronIPCHTTPService, PageDatabase]
})
export class ServiceModule {
}