import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Calendario, Ente, PrenotazioneIncontro, SchedaAnagraficoProfessionale, SlotIncontro, Sportello } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, MOMENT_I18N_IT, TipoUtente } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import getDeepValue from 'get-deep-value';
import * as moment from 'moment';
import { isNullOrUndefined } from 'util';
import { CommonPslpService } from '@pslwcl/pslservice';
import { AppuntamentoUtilitiesService } from './appuntamento-utilities.service';

interface Slot {
  idSlot: number;
  inizio: {
    ora: number;
    minuti: number;
  };
  disponibilita: boolean;
}
interface CalendarioAppuntamento {
  giorno: number;
  disponibilita: number;
  selected: boolean;
  slot: Slot[];
}
export interface Orario {
  idSlot: number;
  ora: number;
  minuti: number;
  active: boolean;
  selected: boolean;
}

@Component({
  selector: 'pslshare-appuntamento',
  templateUrl: './appuntamento.component.html',
  styleUrls: ['./appuntamento.component.css']
})
export class AppuntamentoComponent implements OnInit {
  private static readonly COD_TIPO_UTENTE_CITT = 'CIT';
  @Input() idSilLavRiferimentoAdesioneDomanda: number;   // id rifermento adesioneYG o domandaRDC

  @Input() isOperatore: boolean;
  @Input() msgSposta: string;
  @Input() appuntamentoOld: PrenotazioneIncontro;
  @Input() idUtente: number;
  @Input() codAmbito: string;
  @Output() confermato = new EventEmitter<void>();

  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';
  private readonly ELAPSED_DAY = 0;

  private sap: SchedaAnagraficoProfessionale;

  dataDa: moment.Moment;
  private dataA: moment.Moment;
  ambitoDescr: string;
  enti: Ente[];
  sportelli: Sportello[];
  calendario: CalendarioAppuntamento[];
  orario: Array<Array<Orario>>;
  weeks: number[] = [];

  flag = {
    confermato: false,
    calendario: false,
    orario: false,
    prevCalendario: true,
    nextCalendario: true,
    errore: false,
    confermaAttivo: true,
    disableCalendar: false
  };

  enteIndex: number;
  sportelloIndex: number;
  calendarioIndex: number;
  note: string;

  dataAppuntamento: Date;
  oraAppuntamento: Date;
  email: string;
  messaggio: string;
  statoAppuntamento: string;
  calendarioPortale: Calendario;

  msgVisualizzazioneUtente = {
    msgMailPromemoria: false,
    msgMail: false,
    msgPromemoria: false
  };

  private messaggioSameDayHour;
  private primoGiornoDisponibile: moment.Moment;
  private ultimoGiornoDisponibile: moment.Moment;
  msgCalendario: string;


  constructor(
    private readonly commonPslpService: CommonPslpService,
    private readonly operatoreService: OperatoreService,
    private readonly appuntamentoUtilitiesService: AppuntamentoUtilitiesService,
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService
  ) {
    moment.locale('it', MOMENT_I18N_IT);
  }

  /**
   * Giornata vuota
   * @param [giorno] numero giorno
   * @returns CalendarioAppuntamento
   */
  private static giornataVuota(giorno = 0): CalendarioAppuntamento {
    return {
      'giorno': giorno,
      'disponibilita': 0,
      'selected': false,
      'slot': []
    };
  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    switch (this.codAmbito) {
      case Ambito.GG.valueOf():
        this.ambitoDescr = 'Garanzia Giovani';
        break;
      case Ambito.RDC.valueOf():
        this.ambitoDescr = 'Reddito di Cittadinanza';
        break;
      default:
        this.ambitoDescr = '';
    }
    this.flag.disableCalendar = false;
    let codTipoUtente = AppuntamentoComponent.COD_TIPO_UTENTE_CITT;
    if (this.isOperatore) {
      this.sap = await this.appuntamentoUtilitiesService.getSap(this.idUtente);
      codTipoUtente = TipoUtente.getByCodice(this.operatoreService.getRuolo()).valore;
    } else {
      this.sap = await this.commonPslpService.getSap$();
    }
    const [enti, messaggioSameDayHour] = await Promise.all([
      this.appuntamentoUtilitiesService.getSportelli(this.sap, this.codAmbito, codTipoUtente),
      this.utilitiesService.getMessage('ME042')
    ]);
    this.enti = enti;
    this.messaggioSameDayHour = messaggioSameDayHour;
    if (this.enti.length > 0) {
      this.enteIndex = 0;
      this.onChangeEnte();
    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Determines whether change ente on
   */
  onChangeEnte() {
    this.sportelli = this.enti[this.enteIndex].sportelli;
    this.sportelloIndex = this.sportelli.length > 0 ? 0 : null;
    this.onChangeSportello();
  }

  /**
   * Determines whether change sportello on
   *
   */
  async onChangeSportello() {
    this.flag.calendario = false;
    this.flag.orario = false;
    if (this.sportelloIndex === undefined || this.sportelloIndex === null) {
      return;
    }

    this.primoGiornoDisponibile = null;
    this.ultimoGiornoDisponibile = null;
    const sportello = this.enti[this.enteIndex].sportelli[this.sportelloIndex];
    this.msgCalendario = null;
    const calendario: Calendario = await this.appuntamentoUtilitiesService.getCalendario(sportello, this.codAmbito);
    if (calendario.flag_bloccato) {
      this.dataDa = null;
      this.dataA = null;
      this.calendario = [];

      // MI023
      const msg = await this.utilitiesService.getMessage('MI023');
      this.msgCalendario = msg;
      return;
    }
    // ricerca primo giorno disponibile
    this.calendarioPortale = calendario;
    const intervalloDisponibile: Array<Date> = await this.appuntamentoUtilitiesService.getIntervalloDisponibile(sportello, this.codAmbito);
    if (!isNullOrUndefined(intervalloDisponibile) && !isNullOrUndefined(intervalloDisponibile[0])) {
      this.logService.log('primo giorno disponibile :', intervalloDisponibile[0]);
      this.dataDa = moment(intervalloDisponibile[0]).startOf('month');
      this.dataA = moment(this.dataDa).endOf('month');
    } else {
      this.dataDa = null;
      this.dataA = null;
      this.calendario = [];
      return;
    }
    this.primoGiornoDisponibile = moment(intervalloDisponibile[0]);
    this.ultimoGiornoDisponibile = moment(intervalloDisponibile[1]);
    await this.changeCalendario();
    const primoGiornoIndex = this.calendario.findIndex(c => c.disponibilita > 0);
    this.onClickCalendario(primoGiornoIndex);
    this.onClickOrario(0, 0);
    this.testEnablePrevCalendario();
    this.testEnableNextCalendario();
  }

  /**
   * Tests enable prev calendario
   */
  private testEnablePrevCalendario() {
    this.flag.prevCalendario = this.primoGiornoDisponibile.diff(this.dataDa) < 0;
  }

  /**
   * Tests enable next calendario
   */
  private testEnableNextCalendario() {
    this.flag.nextCalendario = this.ultimoGiornoDisponibile.diff(this.dataA) > 0;
  }

  /**
   * Determines whether prev calendario on
   */
  onPrevCalendario() {
    this.dataDa = moment(this.dataDa).subtract(1, 'months').startOf('month');
    this.dataA = moment(this.dataDa).endOf('month');
    this.changeCalendario();
    this.testEnablePrevCalendario();
    this.flag.nextCalendario = true;
  }

  /**
   * Determines whether next calendario on
   */
  onNextCalendario() {
    this.dataDa = moment(this.dataDa).add(1, 'months').startOf('month');
    this.dataA = moment(this.dataDa).endOf('month');
    this.changeCalendario();
    this.flag.prevCalendario = true;
    this.testEnableNextCalendario();
  }

  /**
   * Changes calendario
   */
  private async changeCalendario() {
    this.calendario = [] as CalendarioAppuntamento[];
    this.orario = null;
    this.calendarioIndex = null;
    this.flag.calendario = false;
    this.flag.orario = false;

    // ricerca slot disponibili
    const sportello = this.enti[this.enteIndex].sportelli[this.sportelloIndex];
    const slotsIncontro: SlotIncontro[] = await this.appuntamentoUtilitiesService.getSlots(this.dataDa, this.dataA, sportello, this.codAmbito);

    // creazione di un calendario con giorni disponibili
    const calendarioDisponibilita = [] as CalendarioAppuntamento[];
    const giornoPrenotabile = moment(new Date()).add(this.ELAPSED_DAY, 'days');
    slotsIncontro.forEach((incontro: SlotIncontro) => {
      const giorno = moment(incontro.giorno, this.DATE_FORMAT);
      if (giornoPrenotabile.diff(giorno) > 0) {
        return;
      }
      let giornata = calendarioDisponibilita.find(g => g.giorno === giorno.date());
      if (giornata === undefined) {
        giornata = AppuntamentoComponent.giornataVuota(giorno.date());
        calendarioDisponibilita.push(giornata);
      }
      giornata.disponibilita += incontro.disponibilita;
      giornata.slot.push({
        'idSlot': incontro.id_slot,
        'inizio': {
          'ora': moment(incontro.da_ora, this.TIME_FORMAT).hour(),
          'minuti': moment(incontro.da_ora, this.TIME_FORMAT).minute(),
        },
        'disponibilita': incontro.disponibilita > 0
      });
    });

    // creazione calendario completo
    if (this.dataDa !== undefined) {
      this.computeWeekNumber(this.dataDa.get('month'), this.dataDa.get('year'));
      const offsetMese = this.dataDa.isoWeekday() - 1;
      const giorniMese = this.dataA.diff(this.dataDa, 'days') + 1;
      const padding = (7 * 6) - offsetMese - giorniMese;
      let offset = moment(this.dataDa).subtract(offsetMese, 'days');
      for (let i = 0; i < offsetMese; i++) {
        this.calendario.push(AppuntamentoComponent.giornataVuota(offset.date()));
        offset = offset.add(1, 'days');
      }
      for (let i = 1; i <= giorniMese; i++) {
        const giorno = calendarioDisponibilita.find(g => g.giorno === i);
        this.calendario.push(giorno === undefined ? AppuntamentoComponent.giornataVuota(i) : giorno);
      }
      for (let i = 1; i <= padding; i++) {
        this.calendario.push(AppuntamentoComponent.giornataVuota(i));
      }
    }
  }

  /**
   * Computes week number
   * @param month mese
   * @param year anno
   */
  private computeWeekNumber(month, year) {
    this.weeks = [0, 1, 2, 3, 4, 5];
  }

  /**
   * Determines whether click calendario on
   * @param selected number
   */
  onClickCalendario(selected: number) {
    this.flag.calendario = true;
    this.flag.orario = false;
    this.calendarioIndex = selected;
    this.flag.errore = false;

    this.calendario.forEach((value, index) => {
      value.selected = index === selected;
      if (value.selected) {
        // imposta orario
        value.slot.sort((a: Slot, b: Slot) => (a.inizio.ora * 60 + a.inizio.minuti) - (b.inizio.ora * 60 + b.inizio.minuti));
        const slots = value.slot;
        this.orario = [];
        for (let i = 0; i < Math.ceil(slots.length / 3); i++) { this.orario[i] = []; }
        for (let i = 0; i < slots.length; i++) {
          this.orario[Math.floor(i / 3)][i % 3] = {
            idSlot: slots[i].idSlot,
            ora: slots[i].inizio.ora,
            minuti: slots[i].inizio.minuti,
            active: slots[i].disponibilita,
            selected: false
          };
        }
      }
    });
  }

  /**
   * Determines whether click orario on
   * @param posRiga: number
   * @param posColonna: number
   */
   onClickOrario(posRiga: number, posColonna: number) {
    const selected = posRiga * 3 + posColonna;
    this.flag.orario = true;
    this.flag.errore = false;
    this.orario.forEach(
      (riga: Orario[], rowIndex: number) => riga.forEach(
        (colonna: Orario, colIndex: number) => colonna.selected = (rowIndex * 3 + colIndex) === selected));
  }

  /**
   * Determines whether calendario selezionato is
   * @returns boolean
   */
  isCalendarioSelezionato() {
    if (isNullOrUndefined(this.calendarioIndex)) {
      return false;
    }
    return true;
  }

  /**
   * Determines whether conferma on
   *
   */
  async onConferma() {
    const incontro = this.calendario[this.calendarioIndex];
    const slot = this.orario.reduce((acc: Orario, el) => acc ? acc : el.find(inner => inner.selected === true), undefined);

    if (this.appuntamentoOld
      && this.appuntamentoOld.slot
      && this.appuntamentoOld.slot.id_slot === slot.idSlot) {
      this.messaggio = this.messaggioSameDayHour;
      this.flag.errore = true;
      return;
    }

    this.dataAppuntamento = moment(this.dataDa).date(incontro.giorno).toDate();
    this.oraAppuntamento = moment().hour(slot.ora).minute(slot.minuti).toDate();
    this.email = getDeepValue(this.sap, 'recapito.email');
    this.statoAppuntamento = this.appuntamentoUtilitiesService.DA_EROGARE;
    this.handleMessaggioVisualizzazione();

    this.utilitiesService.showSpinner();
    try {
      await this.appuntamentoUtilitiesService.saveIncontro(slot.idSlot, this.note, this.idSilLavRiferimentoAdesioneDomanda, this.idUtente, this.appuntamentoOld);
      this.flag.confermato = true;
      this.flag.confermaAttivo = false;
      this.flag.disableCalendar = true;
      this.confermato.emit();
    } catch (err) {
      this.messaggio = err.message;
      this.flag.errore = true;
    }
    this.utilitiesService.hideSpinner();
  }

  /**
   * Handles messaggio visualizzazione
   *
   */
  private handleMessaggioVisualizzazione() {
    this.msgVisualizzazioneUtente.msgMailPromemoria = false;
    this.msgVisualizzazioneUtente.msgMail = false;
    this.msgVisualizzazioneUtente.msgPromemoria = false;

    if (this.email && this.calendarioPortale) {
        if (this.calendarioPortale.invio_conferma_prenotazione === 'S' && this.calendarioPortale.ore_invio_promemoria > 0) {
          this.msgVisualizzazioneUtente.msgMailPromemoria = true;
        } else if (this.calendarioPortale.invio_conferma_prenotazione === 'S') {
          this.msgVisualizzazioneUtente.msgMail = true;
        } else if (this.calendarioPortale.ore_invio_promemoria > 0) {
          this.msgVisualizzazioneUtente.msgPromemoria = true;
        }
    }
  }

}
