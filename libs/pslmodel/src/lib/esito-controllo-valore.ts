export interface EsitoControlloValore {
  valore?: string;                  // valore da controllare
  maxRedditoCollMirato?: string;    // valore da parametro importo massimo
  messaggioInput?: string;
  messaggio?: string;               // messaggio restituito in caso di errore
  errore?: boolean;
}
