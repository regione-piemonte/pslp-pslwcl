import { UtenteACarico, PrenotazioneIncontro, AdesioneYG, SchedaAnagraficoProfessionale, Utente } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export interface UtenteACaricoWrapperInterface {
  utenteACarico: UtenteACarico;
  isMinorenne: boolean;
  sap: SchedaAnagraficoProfessionale;
  adesione: AdesioneYG;
  tutori?: Utente[];
  appuntamento?: PrenotazioneIncontro;
  prenotabile?: boolean;
}
