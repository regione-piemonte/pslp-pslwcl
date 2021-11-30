import { TypeDialogMessage } from './type-dialog-message';

/**
 * Dialog modale message
 *
 *    tipo descrive varie opzioni previste
 *       SI/NO  -  ANNULLA/CONFERMA
 *    titolo = titolo della finestra modale
 *    messaggio  contenuto principale da visualizzare
 *    messaggioAggiuntivo  contenuto aggiuntivo
 */
export interface DialogModaleMessage {
  tipo: TypeDialogMessage;
  titolo: string;
  messaggio?: string;
  messaggioAggiuntivo?: string;
}
