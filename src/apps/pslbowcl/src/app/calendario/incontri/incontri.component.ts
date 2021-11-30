import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, ConfigurazioneCalendario, ConfigurazioneCalendarioPeriodoValidita, SlotIncontro } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { MOMENT_I18N_IT } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { LogService, OperatoreService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import * as moment from 'moment';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

interface Slot {
  idSlot: number;
  inizio: {
    ora: number;
    minuti: number;
  };
  fine: {
    ora: number;
    minuti: number;
  };
  disponibilita: number;
  massimo: number;
  valide: number;
}
interface CalendarioAppuntamento {
  giorno: number;
  disponibilita: number;
  massimo: number;
  selected: boolean;
  slot: Slot[];
}
export interface Orario {
  idSlot: number;
  ora: number;
  minuti: number;
  oraFine: number;
  minutiFine: number;
  active: boolean;
  disponibilita: number;
  selected: boolean;
  massimo: number;
  valide: number;
}

/**
 * Component IncontriComponent
 *  visuliazza calendario incontri
 */
@Component({
  selector: 'pslbowcl-incontri',
  templateUrl: './incontri.component.html',
  styleUrls: ['./incontri.component.css']
})
export class IncontriComponent implements OnInit, OnDestroy {
  private readonly DATE_FORMAT = 'DD/MM/YYYY';
  private readonly TIME_FORMAT = 'HH:mm';
  private readonly subscriptions: Subscription[] = [];
  private confCalendario: ConfigurazioneCalendario;
  data_da: moment.Moment;
  private data_a: moment.Moment;

  dataDa: moment.Moment;
  private dataA: moment.Moment;

  calendario: CalendarioAppuntamento[];
  orario: Array<Array<Orario>>;
  weeks: number[] = [];
  private idUtente: number;
  flag = {
    calendario: false,
    prevCalendario: true,
    nextCalendario: true,
    confermaAttivo: true,
    disableCalendar: false
  };
  calendarioIndex: number;
  note: string;
  private primoGiornoDisponibile: moment.Moment;
  private ultimoGiornoDisponibile: moment.Moment;
  titolo: string;

  constructor(
    private readonly logService: LogService,
    private readonly utilitiesService: UtilitiesService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly operatoreService: OperatoreService,
    private readonly businessService: BusinessService
  ) { moment.locale('it', MOMENT_I18N_IT); }

  private static giornataVuota(giorno = 0): CalendarioAppuntamento {
    return {
      'giorno': giorno,
      'disponibilita': 0,
      'massimo': 0,
      'selected': false,
      'slot': []
    };
  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.idUtente = this.operatoreService.getOperatoreByRuolo().id_utente;
    this.subscriptions.push(this.route.data.subscribe(
      (data: ConfigurazioneCalendario) => {
        this.utilitiesService.showSpinner();
        this.confCalendario = data['configurazioneCalendario'];
        this.inizializza();
      })
    );
    this.titolo = "Incontri - "
                 + this.confCalendario.nome
                 + " [ " + this.confCalendario.codice_ambito + " ]";
  }

  private async inizializza() {
    this.flag.disableCalendar = false;
    this.getCalendario();
    this.utilitiesService.hideSpinner();
  }
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
  async getCalendario() {
    let data: ConfigurazioneCalendarioPeriodoValidita = this.confCalendario.periodi_validita.reduce(
      (accumulator, currentValue) =>
        !accumulator || accumulator.data_da > currentValue.data_da ? currentValue : accumulator
      , null);
    this.primoGiornoDisponibile = moment(data.data_da);
    data = this.confCalendario.periodi_validita.reduce(
      (accumulator, currentValue) =>
        !accumulator || accumulator.data_a < currentValue.data_a ? currentValue : accumulator
      , data);
    this.ultimoGiornoDisponibile = moment(data.data_a);

    this.logService.log('primo  giorno disponibile :', this.primoGiornoDisponibile);
    this.logService.log('ultimo giorno disponibile :', this.ultimoGiornoDisponibile);
    const currentDate = moment(new Date());
    let giorno = 1;
    if (currentDate.isBetween(this.primoGiornoDisponibile, this.ultimoGiornoDisponibile)) {
      this.dataDa = moment(currentDate).startOf('month');
      giorno = moment(currentDate).date();
    } else {
      this.dataDa = moment(this.primoGiornoDisponibile).startOf('month');
    }
    this.dataA = moment(this.dataDa).endOf('month');

    await this.changeCalendario();
    const primoGiornoIndex = this.calendario.findIndex(c => c.massimo > 0 && c.giorno >= giorno);
    this.onClickCalendario(primoGiornoIndex);
    this.onClickOrario(0, 0);
    this.testEnablePrevCalendario();
    this.testEnableNextCalendario();
  }

  /**
   * Determines whether prev calendario on
   *  consente di visualizzare il mese precedente
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
   *  consente di visualizzare il mese successivo
   */
  onNextCalendario() {
    this.dataDa = moment(this.dataDa).add(1, 'months').startOf('month');
    this.dataA = moment(this.dataDa).endOf('month');
    this.changeCalendario();
    this.flag.prevCalendario = true;
    this.testEnableNextCalendario();
  }

  /**
   * Tests enable prev calendario
   *  verifica se possibile andare indietro
   */
  private testEnablePrevCalendario() {
    this.flag.prevCalendario = this.primoGiornoDisponibile.diff(this.dataDa) < 0;
  }

  /**
   * Tests enable next calendario
   *  verifica se possibile andare avanti
   */
  private testEnableNextCalendario() {
    this.flag.nextCalendario = this.ultimoGiornoDisponibile.diff(this.dataA) > 0;
  }

  private async changeCalendario() {
    this.utilitiesService.showSpinner();
    this.calendario = [] as CalendarioAppuntamento[];
    this.orario = null;
    this.calendarioIndex = null;
    this.flag.calendario = false;

    // ricerca slot
    const slotIncontri: SlotIncontro[] = await this.businessService.findSlotCalendario(
      this.idUtente, this.confCalendario.id_calendario, { data_da: this.dataDa.toDate(), data_a: this.dataA.toDate() })
    .pipe(
      catchError(() => of([] as SlotIncontro[]))
    ).toPromise();

    // creazione di un calendario con giorni disponibili
    const calendarioDisponibilita = [] as CalendarioAppuntamento[];
    slotIncontri
    .filter(slot => moment(slot.giorno, 'dd/MM/yyyy').month() === this.dataDa.month())
    .forEach((slot: SlotIncontro) => {
      const giorno = moment(slot.giorno, this.DATE_FORMAT);
      let giornata = calendarioDisponibilita.find(g => g.giorno === giorno.date());
      if (giornata === undefined) {
        giornata = IncontriComponent.giornataVuota(giorno.date());
        calendarioDisponibilita.push(giornata);
      }
      giornata.disponibilita += slot.disponibilita;
      giornata.massimo += slot.numero_prenotazioni_massimo;
      giornata.slot.push({
        'idSlot': slot.id_slot,
        'inizio': {
          'ora': moment(slot.da_ora, this.TIME_FORMAT).hour(),
          'minuti': moment(slot.da_ora, this.TIME_FORMAT).minute(),
        },
        'fine': {
          'ora': moment(slot.a_ora, this.TIME_FORMAT).hour(),
          'minuti': moment(slot.a_ora, this.TIME_FORMAT).minute(),
        },
        'disponibilita': slot.disponibilita,
        'massimo': slot.numero_prenotazioni_massimo,
        'valide': slot.numero_prenotazioni_valide
      });
    });

    // creazione calendario completo
    if (this.dataDa !== undefined) {
      this.computeWeekNumber(this.dataDa);
      const offsetMese = this.dataDa.isoWeekday() - 1;
      const giorniMese = this.dataA.diff(this.dataDa, 'days') + 1;
      const padding = (7 * 6) - offsetMese - giorniMese;
      let offset = moment(this.dataDa).subtract(offsetMese, 'days');
      for (let i = 0; i < offsetMese; i++) {
        this.calendario.push(IncontriComponent.giornataVuota(offset.date()));
        offset = offset.add(1, 'days');
      }
      for (let i = 1; i <= giorniMese; i++) {
        const giorno = calendarioDisponibilita.find(g => g.giorno === i);
        this.calendario.push(giorno === undefined ? IncontriComponent.giornataVuota(i) : giorno);
      }
      for (let i = 1; i <= padding; i++) {
        this.calendario.push(IncontriComponent.giornataVuota(i));
      }
    }
    this.utilitiesService.hideSpinner();
  }

  private computeWeekNumber(data: moment.Moment) {
    let numberDay = moment(data).endOf('month').date();
    let startDayWeek = moment(data).startOf('month').day();
    let endDayWeek = moment(data).endOf('month').day();
    startDayWeek = startDayWeek === 0 ? 7 : startDayWeek;
    endDayWeek = endDayWeek === 0 ? 7 : endDayWeek;
    numberDay += startDayWeek - 1;
    numberDay += 7 - endDayWeek;
    const numberWeek = Math.ceil(numberDay / 7);
    this.weeks = [];
    for (let i = 0; i < numberWeek; i++) {
      this.weeks.push(i);
    }
  }

  onClickCalendario(selected: number) {
    this.flag.calendario = true;
    this.calendarioIndex = selected;

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
            oraFine: slots[i].fine.ora,
            minutiFine: slots[i].fine.minuti,
            active: slots[i].massimo > 0,
            disponibilita: slots[i].disponibilita,
            massimo: slots[i].massimo,
            valide: slots[i].valide,
            selected: false
          };
        }
      }
    });
  }

  /**
   * Gets slot disponibili
   * @param calendario CalendarioAppuntamento
   * @returns slot disponibili
   */
  getSlotDisponibili(calendario: CalendarioAppuntamento): Slot[] {
    return calendario.slot.filter(el => el.massimo > 0);
  }
  isCalendarioSelezionato() {
    if (isNullOrUndefined(this.calendarioIndex) || isNullOrUndefined(this.calendario[this.calendarioIndex])) {
      return false;
    }
    return true;
  }

  onClickOrario(posRiga: number, posColonna: number) {
    const selected = posRiga * 3 + posColonna;
  }

  /**
   * torna alla ricerca
   */
  onIndietro() {
    this.router.navigateByUrl('/calendario/ricerca');
  }
}

