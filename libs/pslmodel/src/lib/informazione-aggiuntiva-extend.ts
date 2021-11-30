import { InformazioneAggiuntiva } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export interface InformazioneAggiuntivaExtend {
  informazioneAggiuntiva: InformazioneAggiuntiva;
  descrizione?: string;
  new: boolean;
}

export function informazioneAggiuntivaExtendSorter(a: InformazioneAggiuntivaExtend, b: InformazioneAggiuntivaExtend) {
  return (a.descrizione || '').localeCompare(b.descrizione || '')
      // tslint:disable-next-line: max-line-length
      || (a.informazioneAggiuntiva.data && b.informazioneAggiuntiva.data ? a.informazioneAggiuntiva.data.getTime() - b.informazioneAggiuntiva.data.getTime() : 0)
      || (a.informazioneAggiuntiva.valore || '').localeCompare(b.informazioneAggiuntiva.valore || '');
}

