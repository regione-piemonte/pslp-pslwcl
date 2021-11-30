import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MailComponent } from './mail/mail.component';
import { InformazioniAggiuntiveComponent } from './informazioni-aggiuntive/informazioni-aggiuntive.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { TextMaskModule } from 'angular2-text-mask';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';

import { ConfigurazioneRoutingModule } from './configurazione-routing.module';
import { ConfigurazioneComponent } from './configurazione.component';
import { AggiungiInformazioneComponent } from './informazioni-aggiuntive/aggiungi-informazione/aggiungi-informazione.component';
import { PsldirectiveModule } from '@pslwcl/psldirective';  // NOSONAR evita falso positivo rule typescript:S4328
import { PipeModule, PslshareModule } from '@pslwcl/pslshare';
@NgModule({
  imports: [
    ConfigurazioneRoutingModule,
    PslshareModule,
    PsldirectiveModule
  ],
  declarations: [
    ConfigurazioneComponent,
    MailComponent,
    InformazioniAggiuntiveComponent,
    AggiungiInformazioneComponent
  ],
  exports: [
  ]
})
export class ConfigurazioneModule { }
