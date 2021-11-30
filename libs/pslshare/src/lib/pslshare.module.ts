import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiModule } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { PsldirectiveModule } from '@pslwcl/psldirective'; // NOSONAR evita falso positivo rule typescript:S4328
import { TextMaskModule } from 'angular2-text-mask';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { MonthDatePickerComponent } from './common';
import { AggiungiAllegatoPattoComponent } from './common/allegati/aggiungi-allegato/aggiungi-allegato.component';
import { AllegatiCittadinoComponent } from './common/allegati/allegati-cittadino.component';
import { AllegatiPattoComponent } from './common/allegati/allegati-patto.component';
import { AppuntamentoComponent } from './common/appuntamento/appuntamento.component';
import { ConfermaDatiAnagraficiComponent } from './common/conferma/conferma-dati-anagrafici/conferma-dati-anagrafici.component';
import { ConfermaInformazioniAggiuntiveComponent } from './common/conferma/conferma-informazioni-aggiuntive/conferma-informazioni-aggiuntive.component';
import { DatiAnagraficiCittadinoComponent } from './common/dati-anagrafici-cittadino/dati-anagrafici-cittadino.component';
import { DatiAnagraficiDisplayComponent } from './common/dati-anagrafici-display/dati-anagrafici-display.component';
import { DatiAnagraficiFascicoloComponent } from './common/dati-anagrafici-fascicolo/dati-anagrafici-fascicolo.component';
import { ErrorHandlerComponent } from './common/error-handler/error-handler.component';
import { IndirizzoComponent } from './common/indirizzo/indirizzo.component';
import { AggiungiInfoComponent } from './common/informazioni-aggiuntive/aggiungi-info/aggiungi-info.component';
import { InformazioniAggiuntiveComponent } from './common/informazioni-aggiuntive/informazioni-aggiuntive.component';
import { NoPaginatedTableComponent, NoPaginationBodyDirective, NoPaginationHeadDirective } from './common/no-paginated-table/no-paginated-table.component';
import { PaginatedTableComponent, PaginationBodyDirective, PaginationHeadDirective } from './common/paginated-table/paginated-table.component';
import { SortableDirective } from './common/paginated-table/sortable.directive';
import { RecapitiComponent } from './common/recapiti/recapiti.component';
import { ShowdataComponent } from './common/showdata/showdata.component';
import {
  AllegatiRichiestaIscrizioneComponent, DatiDIDComponent, DatiGraduatoriaComponent,
  DisabileComponent, FamigliariACaricoComponent, FamiliariRichiestaIscrizioneComponent, GraduatoriaComponent, NavigationButtonCMComponent,
  RedditoRichiestaIscrizioneComponent,
  RiepilogoCMComponent, RiepilogoRichiestaIscrizioneComponent, SchedaCMComponent, WizardCMComponent
} from './maschere';
import { DettaglioRedditoComponent } from './maschere/collocamento-mirato/dati-graduatoria/dettaglio-reddito/dettaglio-reddito.component';
import { DatiIscrizioniComponent } from './maschere/collocamento-mirato/dati-iscrizioni/dati-iscrizioni.component';
import { LavoratoreWrapperComponent } from './maschere/collocamento-mirato/richiesta-iscrizione/lavoratore/lavoratore-wrapper.component';
import { RichiestaComponent } from './maschere/collocamento-mirato/richiesta-iscrizione/richiesta/richiesta.component';
import { ElencoRichiesteComponent } from './maschere/collocamento-mirato/riepilogo/scheda-cm/elenco-richieste/elenco-richieste.component';
import { ErrorPageComponent } from './pagine/error-page/error-page.component';
import { HelpComponent } from './pagine/help/help.component';
import { HomeComponent } from './pagine/home/home.component';
import { LoginOperatoreComponent } from './pagine/login-operatore/login-operatore.component';
import { LoginComponent } from './pagine/login/login.component';
import { PageNotFoundComponent } from './pagine/page-not-found/page-not-found.component';
import { SceltaOperatoreComponent } from './pagine/scelta-operatore/scelta-operatore.component';
import { PipeModule } from './pipe/pipe.module';
import { DialogModaleComponent } from './plugins/dialog-modale/dialog-modale.component';
import { SliderComponent } from './plugins/slider/slider.component';
import { FooterComponent } from './sezioni/footer/footer.component';
import { HeaderOperComponent } from './sezioni/header-oper/header-oper.component';
import { HeaderComponent } from './sezioni/header/header.component';
import { NavbarComponent } from './sezioni/navbar/navbar.component';
import { PreFooterComponent } from './sezioni/pre-footer/pre-footer.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    }),
    TextMaskModule,
    NgbModule,
    NgxSpinnerModule,
    ToastrModule.forRoot(),  // https://www.npmjs.com/package/ngx-toastr
    FormsModule,
    ApiModule,
    PsldirectiveModule,
    PipeModule],
  declarations: [
    DialogModaleComponent,
    ErrorPageComponent,
    PreFooterComponent,
    SceltaOperatoreComponent,
    LoginOperatoreComponent,
    FooterComponent,
    HeaderComponent,
    HeaderOperComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    HelpComponent,
    RecapitiComponent,
    IndirizzoComponent,
    PaginatedTableComponent,
    PaginationBodyDirective,
    PaginationHeadDirective,
    NoPaginatedTableComponent,
    NoPaginationBodyDirective,
    NoPaginationHeadDirective,
    SortableDirective,
    AppuntamentoComponent,
    DatiAnagraficiDisplayComponent,
    PageNotFoundComponent,
    ShowdataComponent,
    ErrorHandlerComponent,
    AllegatiCittadinoComponent,
    AllegatiPattoComponent,
    DettaglioRedditoComponent,
    FamigliariACaricoComponent,
    DatiGraduatoriaComponent,
    RedditoRichiestaIscrizioneComponent,
    FamiliariRichiestaIscrizioneComponent,
    NavigationButtonCMComponent,
    WizardCMComponent,
    RiepilogoCMComponent,
    SchedaCMComponent,
    ElencoRichiesteComponent,
    InformazioniAggiuntiveComponent,
    AggiungiInfoComponent,
    ConfermaInformazioniAggiuntiveComponent,
    ConfermaDatiAnagraficiComponent,
    DatiAnagraficiFascicoloComponent,
    DatiAnagraficiCittadinoComponent,
    AggiungiAllegatoPattoComponent,
    SliderComponent,
    LavoratoreWrapperComponent,
    RichiestaComponent,
    DisabileComponent,
    GraduatoriaComponent,
    AllegatiRichiestaIscrizioneComponent,
    RiepilogoRichiestaIscrizioneComponent,
    DatiDIDComponent,
    DatiIscrizioniComponent,
    MonthDatePickerComponent
  ],
  exports: [
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HttpClientXsrfModule,
    TextMaskModule,
    NgbModule,
    NgxSpinnerModule,
    ToastrModule,  // https://www.npmjs.com/package/ngx-toastr
    FormsModule,
    PipeModule,
    PsldirectiveModule,
    ErrorPageComponent,
    FooterComponent,
    PreFooterComponent,
    SceltaOperatoreComponent,
    LoginOperatoreComponent,
    HeaderComponent,
    HeaderOperComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    HelpComponent,
    RecapitiComponent,
    IndirizzoComponent,
    PaginatedTableComponent,
    PaginationBodyDirective,
    PaginationHeadDirective,
    NoPaginatedTableComponent,
    NoPaginationBodyDirective,
    NoPaginationHeadDirective,
    SortableDirective,
    AppuntamentoComponent,
    DatiAnagraficiDisplayComponent,
    PageNotFoundComponent,
    ShowdataComponent,
    ErrorHandlerComponent,
    ApiModule,
    DettaglioRedditoComponent,
    FamigliariACaricoComponent,
    DatiGraduatoriaComponent,
    RedditoRichiestaIscrizioneComponent,
    FamiliariRichiestaIscrizioneComponent,
    NavigationButtonCMComponent,
    WizardCMComponent,
    RiepilogoCMComponent,
    SchedaCMComponent,
    ElencoRichiesteComponent,
    InformazioniAggiuntiveComponent,
    AggiungiInfoComponent,
    ConfermaInformazioniAggiuntiveComponent,
    ConfermaDatiAnagraficiComponent,
    DatiAnagraficiFascicoloComponent,
    DatiAnagraficiCittadinoComponent,
    AllegatiCittadinoComponent,
    AllegatiPattoComponent,
    AggiungiAllegatoPattoComponent,
    SliderComponent,
    LavoratoreWrapperComponent,
    RichiestaComponent,
    DisabileComponent,
    GraduatoriaComponent,
    AllegatiRichiestaIscrizioneComponent,
    RiepilogoRichiestaIscrizioneComponent,
    DatiDIDComponent,
    DatiIscrizioniComponent,
    MonthDatePickerComponent
  ],
  entryComponents: [
    DialogModaleComponent
  ]
})
export class PslshareModule { }
