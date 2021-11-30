import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BusinessService, Documento, EsitoDettaglioDid, TipoDocumento } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Ambito, fileType, FileTypeResult, StatoDocumento } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { AppUserService, CommonPslpService, LogService, UtilitiesService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isNull, isNullOrUndefined } from 'util';



const SCEGLI_UN_FILE = 'Scegli un file';
@Component({
  selector: 'pslshare-aggiungi-allegato',
  templateUrl: './aggiungi-allegato.component.html'
})
export class AggiungiAllegatoPattoComponent implements OnInit {
  private static readonly SCROLL_TARGET = 'em[data-scroll-marker="salvaAllegato"]';

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // in byte
  @Input() tipoDocumento: TipoDocumento;
  @Input() consideraDID: boolean;
  @Input() consideraRichiestaIscrizione: boolean;
  @Output() success: EventEmitter<void> = new EventEmitter();
  @Output() annulla: EventEmitter<void> = new EventEmitter();

  @ViewChild('allegatoForm', { static: true }) form: NgForm;
  @ViewChild('labelfileToUpload', { static: true }) labelFileToUpload: ElementRef;
  @ViewChild('inputFile', { static: true }) myInputFile: ElementRef;

  fileToUpload: File = null;
  codEstensione = null;
  did: EsitoDettaglioDid = {};

  constructor(
    private readonly logService: LogService,
    private readonly businessService: BusinessService,
    private readonly utilitiesService: UtilitiesService,
    private readonly appUserService: AppUserService,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    const idUtente =  this.appUserService.getIdUtente();
    this.did = await this.commonPslpService.ricercaDettaglioDIDService(idUtente);
  }
  /**
   * Handles file input
   * @param files FileList
   *
   */
  async handleFileInput(files: FileList) {
    this.logService.log('handleFileInput file.lenght ' + files.length);

    if (files.length === 0) {
      this.labelFileToUpload.nativeElement.innerText = SCEGLI_UN_FILE;
      return;
    }
    try {

      this.fileToUpload = files.item(0);
      this.logService.log('handleFileInput file.lenght ' + this.fileToUpload.name);

      this.labelFileToUpload.nativeElement.innerText = this.fileToUpload.name;

      this.codEstensione = this.getCodEstensione(this.fileToUpload);
      this.logService.log('handleFileInput estensione ' + this.codEstensione);
      if (isNull(this.codEstensione)) {
        throw new Error('Estensione non idonea per tipologia documento.');
      }
      this.logService.log('handleFileInput size ' + this.fileToUpload.size);
      if (this.fileToUpload.size > this.MAX_FILE_SIZE) {
        throw new Error('Il documento ha una dimensione troppo grossa.');
      }
      const fileTypeResult = await this.verificaContenutoFile(this.fileToUpload);
      this.logService.log('handleFileInput fileTypeResult ' + fileTypeResult);
      if (!this.checkMimeTypeResult(fileTypeResult)) {
        throw new Error('Il tipo documento non \u00E8 valido.');
      }
      this.logService.log('handleFileInput end no error ');
    } catch (error) {
      this.logService.log('handleFileInput with error ' + error);
      this.labelFileToUpload.nativeElement.innerText = SCEGLI_UN_FILE;
      this.fileToUpload = null;
      this.utilitiesService.showToastrErrorMessage(error.message, 'Caricamento File');
    }
  }


  /**
   * Checks mime type result
   * @param fileTypeResult FileTypeResult
   * @returns boolean
   */
  private checkMimeTypeResult(fileTypeResult: FileTypeResult) {
    return this.tipoDocumento.mime_type.some(element => element.descrizione_mime_type.split(',').some(type => type === fileTypeResult.mime))
      || false;
  }

  /**
   * Gets all mime type
   *
   */
  getAllMimeType() {
    return this.tipoDocumento.mime_type.reduce((acc, el) => el.descrizione_mime_type.trim() + ',' + acc, '');
  }

  /**
   * Gets cod estensione
   * @param file File
   * @returns codice estensione
   */
  private getCodEstensione(file: File) {
    let codEstensione = null;
    this.tipoDocumento.mime_type.forEach(element => {

      if (element.descrizione_mime_type.split(',').some(type => type === file.type)) {

        const estensione = element.codice_estensione;
        if (file.name.lastIndexOf('.') > 0) {
          const est1 = file.name.substr(file.name.lastIndexOf('.') + 1);
          if (est1.toUpperCase() === estensione.toUpperCase()) {
            codEstensione = estensione;
          }
        }
      }
    });
    return codEstensione;
  }

  /**
   * Verificas contenuto file
   * @param file File
   * @returns contenuto file
   */
  private verificaContenutoFile(file: File): Promise<FileTypeResult> {
    return this.readDocumento(file)
      .then(doc => fileType(doc as ArrayBuffer));
  }

  /**
   * Reads documento
   * @param file File
   * @param [flagString] default false
   * @returns documento
   */
  private readDocumento(file: File, flagString = false): Promise<string | ArrayBuffer> {
    const fileReader = new FileReader();
    return new Promise<string | ArrayBuffer>(
      (resolve) => {
        fileReader.onload = () => resolve(fileReader.result);
        if (flagString) {
          fileReader.readAsBinaryString(file);
        } else {
          fileReader.readAsArrayBuffer(file);
        }
      });
  }

  /**
   * Determines whether submit on
   */
  async onSubmit() {
    this.utilitiesService.showSpinner();
    const idUtente =  this.appUserService.getIdUtente();


    this.logService.log(JSON.stringify(this.form.controls.note.value));
    const noteDelloAllegato =  !isNullOrUndefined(this.form.controls.note.value)?this.form.controls.note.value.toUpperCase():"";
    const contenuto = btoa((await this.readDocumento(this.fileToUpload, true)) as string);
    const documento: Documento = {
      codice_tipo_documento: this.tipoDocumento.codice,
      data_inserimento: new Date(),
      data_inserim: new Date(),
      data_aggiornamento: new Date(),
      nome: this.fileToUpload.name,
      pdf: contenuto,
      codice_estensione: this.codEstensione.toUpperCase(),
      note_operatore: '',
      id_utente: idUtente,
      note_cittadino: noteDelloAllegato,
      stato: StatoDocumento.getByDescrizione('Non inviato').codice,
      ambito: this.commonPslpService.getAmbito()
    };
    if (this.consideraDID) {
      documento.ambito = Ambito.DID;
      documento.id_sil_lav_sap_did = this.did.id_did;
    }
    if (this.consideraRichiestaIscrizione) {
      let richiestaIscrizione = await this.commonPslpService.getDettaglioIscrizioneL68$();
      documento.id_sil_rich_coll_mir = richiestaIscrizione.richiesta_iscrizione_header.id_richiesta;
    }
    const updated = await this.businessService.saveDocumento(documento).pipe(
      catchError(err => of(null))
    ).toPromise();
    this.utilitiesService.hideSpinner();
    if (updated) {
      this.labelFileToUpload.nativeElement.innerText = SCEGLI_UN_FILE;
      this.myInputFile.nativeElement.value = '';
      this.fileToUpload = null;

      this.utilitiesService.showToastrInfoMessage('Allegato aggiunto correttamente.', 'Allegati');
    } else {
      this.utilitiesService.showToastrErrorMessage('Inserimento allegato fallito.', 'Allegati');
    }
    this.form.reset();
    this.success.emit();
    this.utilitiesService.scrollTo(AggiungiAllegatoPattoComponent.SCROLL_TARGET);

  }

  /**
   * Determines whether annulla on
   */
  onAnnulla() {
    this.form.reset();
    this.annulla.emit();
  }
}
