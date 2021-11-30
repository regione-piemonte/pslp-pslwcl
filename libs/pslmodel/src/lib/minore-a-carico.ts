import { UtenteACarico, PrenotazioneIncontro, AdesioneYG } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export interface MinoreACaricoWrapperInterface {
  utenteACarico: UtenteACarico;
  adesione: AdesioneYG;
  appuntamento?: PrenotazioneIncontro;
  prenotabile?: boolean;
  descrizione?: string;
}


