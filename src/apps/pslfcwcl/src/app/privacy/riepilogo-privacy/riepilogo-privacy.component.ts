import { Component, OnInit, ViewChild } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { UtenteACarico } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, TypeApplicationCard } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, ParametriSistemaService, SecurityPslpService, SessionStorageService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { isNullOrUndefined } from 'util';
import { GestioneMinorePrivacyComponent } from './gestione-minore-privacy/gestione-minore-privacy.component';
import { SchedaPrivacyComponent } from './scheda-privacy/scheda-privacy.component';

@Component({
  selector: 'pslfcwcl-riepilogo-privacy',
  templateUrl: './riepilogo-privacy.component.html'
})
export class RiepilogoPrivacyComponent implements OnInit {
  idUtente: number;
  ilDestino: string;
  pulsantiAbilitati = true;
  minori: UtenteACarico[];
  hasMinori = false;
  creareNuovaSAP = false;
  loading: number;
  messaggioUtente: string;
  minore: UtenteACarico;
  loadedRiepilogo = false;
  linkIndietro: string = null;
  applIndietro: TypeApplicationCard = null;

  @ViewChild('accordionMinori', { static: false }) accordionMinori: NgbAccordion;
  @ViewChild(SchedaPrivacyComponent, { static: false }) schedaChild;
  @ViewChild(GestioneMinorePrivacyComponent, { static: false }) gestioneChild;
  hasSAP: boolean;

  constructor(
    private readonly router: Router,
    private readonly appUserService: AppUserService,
    private readonly parametriSistemaService: ParametriSistemaService,
    private readonly commonFCService: CommonPslpService,
    private readonly securityService: SecurityPslpService,
    private readonly storageService: SessionStorageService,
    private readonly utilitiesService: UtilitiesService,
    private readonly logService: LogService
  ) { }

  /**
   * on init
   *
   */
  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.commonFCService.AMBITO = Ambito.FASC;
    this.commonFCService.inizializzaHard();

    let destino = this.utilitiesService.getParamLand();
    this.logService.log("DESTINO landing---------------->" + destino);
    if (isNullOrUndefined(destino)) {
       destino = new URL(location.href).searchParams.get("param");
       this.logService.log("DESTINO param---------------->" + destino);
    }
    if (!isNullOrUndefined(destino)) {
       switch (destino) {
         case Ambito.FASC:
           this.linkIndietro = '/fascicolo-cittadino-landing';
           this.applIndietro = TypeApplicationCard.Fascicolo;
           break;
        case Ambito.COMI:
          this.linkIndietro = '/collocamento-mirato-landing';
           this.applIndietro = TypeApplicationCard.Fascicolo;
           break;
        case Ambito.GG:
           this.linkIndietro = '/garanzia-landing';
           this.applIndietro = TypeApplicationCard.Cittadino;
           break;
        case Ambito.RDC:
           this.linkIndietro = '/cittadinanza-landing';
           this.applIndietro = TypeApplicationCard.Cittadino;
           break;
        case Ambito.DID:
           this.linkIndietro = '/did-landing';
           this.applIndietro = TypeApplicationCard.Fascicolo;
           break;
        case Ambito.ISCR:
           this.linkIndietro = '/iscrizione-garanzia-landing';
           this.applIndietro = TypeApplicationCard.Cittadino;
           break;
        default:
          this.linkIndietro = null;
          this.applIndietro = null;
          break;
       }
       this.ilDestino = destino;

    }

    this.storageService.setItem(SessionStorageService.HAS_RIEPILOGO, true);
    this.idUtente = this.appUserService.getIdUtente();

    try {
      this.minori = await this.appUserService.getUtentiACarico(this.idUtente);
    } catch (e) {
      const err: Error = e;
      const msg: Params = { 'message': err.message };
      return this.router.navigate(['/error-page'], { queryParams: msg });
    }
    this.loading = this.minori.length + 2;
    this.hasMinori = this.minori.length > 0;

    let sap;
    if (!this.commonFCService.operareSoloMinori) {
      sap = await this.commonFCService.getSap$(this.idUtente);
    } else {
      const ambito = this.commonFCService.getAmbito();
      sap = await this.commonFCService.getSapAmbito(this.idUtente, ambito);
      if (isNullOrUndefined(sap) || this.commonFCService.creareNuovaSap) {
        this.creareNuovaSAP = true;
      }
    }
    if (!isNullOrUndefined(sap)) {
      this.commonFCService.setSapAndIdUtenteStorage(sap, this.idUtente);
    } else {
      this.commonFCService.setSapAndIdUtenteStorage(null, null);
    }

    const flagS: boolean = await this.parametriSistemaService.isModificabiliSezioni;
    this.commonFCService.sezioniModificabiliFuoriPiemonte = flagS;
    const flagP: boolean = await this.parametriSistemaService.isObbligoDomicPiemonte;
    this.commonFCService.obbligoDomicilioPiemonte = flagP;

    this.hasSAP = !!sap;
    this.loadedRiepilogo = true;
  }

  /**
   * Decreases loading
   */
  async decreaseLoading() {
    this.loading--;
    if (this.loading === 0) {
      const userMessage = await this.utilitiesService.getMessage('MI001');
      this.messaggioUtente = userMessage;

      if (this.minori.length === 1) {
        this.accordionMinori.expand(`minore-${this.minori[0].tutelato.id_utente}`);
      }

      this.utilitiesService.hideSpinner();
    }
  }

  /**
   * Determines whether spara su utente per modificare respo on
   * @param utenteACarico UtenteACarico
   */
  onSparaSuUtentePerModificareRespo(utenteACarico: UtenteACarico) {
    this.minore = utenteACarico;
    this.gestioneChild.minoreACarico = {
            utenteACarico: this.minore
    };
    this.gestioneChild.showTastoAggiungi = false;
    this.gestioneChild.minoreCensito = true;
    this.gestioneChild.modalitaGestioneForm = 'U';
    this.inModifica(true);
  }

  /**
   * Determines whether modifica in
   * @param modifica boolean
   */
  inModifica(modifica: boolean) {
    if (modifica) {
      this.pulsantiAbilitati = false;
    } else {
      this.pulsantiAbilitati = true;
    }
    this.schedaChild.pulsantiAbilitati = this.pulsantiAbilitati;
  }

  /**
   * Determines whether indietro on
   */
  onIndietro() {
    this.securityService.jumpToURL(this.linkIndietro, this.applIndietro);
  }

}
