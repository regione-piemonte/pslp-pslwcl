import { MenuHelpVideo } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328

export enum TipoComponenteHelp {
  MESSAGGIO = 'MESSAGGIO',
  MANUALE = 'MANUALE',
  VIDEO = 'VIDEO'
}
export enum GruppoHelp {
  ASSISTENZA = 'ASSISTENZA',
  MANUALI = 'MANUALI',
  VIDEO = 'VIDEO TUTORIAL'
}
export interface ComponenteHelp {
  tipo: TipoComponenteHelp;
  gruppo: GruppoHelp;
  link: string;
  testo: string;
  titolo: string;
}


export interface BaseHelp {
    id?: string;
    titolo?: string;
    listaMessaggi?: Array<ComponenteHelp>;
    listaManuali?: Array<ComponenteHelp>;
    listaVideo?: Array<MenuHelpVideo>;

  }
