import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {NgxElectronModule} from 'ngx-electron';

import {AppComponent} from './app.component';
import {ServiceModule} from './services/services.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgxElectronModule,
    ServiceModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
