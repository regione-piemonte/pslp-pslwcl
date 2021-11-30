import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CalendarioRoutingModule } from './calendario-routing.module';
import { CalendarioComponent } from './calendario.component';
import { RicercaCalendarioComponent } from './ricerca-calendario/ricerca-calendario.component';
import { WizardComponent } from './wizard/wizard.component';
import { DatiGeneraliComponent } from './dati-generali/dati-generali.component';
import { ConfigurazioneComponent } from './configurazione/configurazione.component';
import { DisponibilitaSettimanaleComponent } from './configurazione/disponibilita-settimanale/disponibilita-settimanale.component';
// tslint:disable-next-line: max-line-length
import { ConfigurazioneFinestraComponent } from './configurazione/disponibilita-settimanale/configurazione-finestra/configurazione-finestra.component';
import { EccezioniComponent } from './configurazione/eccezioni/eccezioni.component';
import { DatiOperativiComponent } from './dati-operativi/dati-operativi.component';
import { DatiMailComponent } from './dati-mail/dati-mail.component';
import { IncontriComponent } from './incontri/incontri.component';
import { AggiungiPeriodoComponent } from './dati-generali/aggiungi-periodo/aggiungi-periodo.component';
import { ConfigurazioneCalendarioService } from './configurazione/configurazione-calendario.service';
import { DuplicaComponent } from './duplica/duplica.component';
import { DatiDuplicazioneCalendarioComponent } from './duplica/dati-duplicazione-calendario/dati-duplicazione-calendario.component';
import { ApplicaAdAltriComponent } from './applica-ad-altri/applica-ad-altri.component';
import { PslshareModule } from '@pslwcl/pslshare';
@NgModule({
  imports: [
    PslshareModule,
    CalendarioRoutingModule,
    BrowserAnimationsModule
  ],
  declarations: [
    CalendarioComponent,
    RicercaCalendarioComponent,
    WizardComponent,
    DatiGeneraliComponent,
    ConfigurazioneComponent,
    DisponibilitaSettimanaleComponent,
    ConfigurazioneFinestraComponent,
    EccezioniComponent,
    DatiOperativiComponent,
    DatiMailComponent,
    IncontriComponent,
    AggiungiPeriodoComponent,
    DuplicaComponent,
    DatiDuplicazioneCalendarioComponent,
    ApplicaAdAltriComponent
  ],
  providers: [
    ConfigurazioneCalendarioService
  ],
  exports: [ ]
})
export class CalendarioModule { }
