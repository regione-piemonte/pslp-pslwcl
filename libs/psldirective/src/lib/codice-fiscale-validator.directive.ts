import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[pslwcllibCodiceFiscaleValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CodiceFiscaleValidator,
      multi: true
    }
  ]
})

export class CodiceFiscaleValidator implements Validator {
  // caratteri ammessi :
  private static readonly tuttiCaratteri = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // valori dei caratteri di ordine pari :
  // tslint:disable-next-line: max-line-length
  private static readonly valoriPari = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

  // valori dei caratteri di ordine dispari :
  // tslint:disable-next-line: max-line-length
  private static readonly valoriDispari = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];

  private static valore(cf: string, index: number, valori: number[]): number {
    return valori[CodiceFiscaleValidator.tuttiCaratteri.indexOf(cf.charAt(index))];
  }

  private static verificaCodiceFiscale(cf: string): string | null {
    // Se il codice è una stringa vuota, il codice è corretto
    if (!cf || cf.length === 0) {
      return;
    }
    // Se la lunghezza del codice è diversa da 16, il codice è errato
    if (cf.length !== 16) {
      return 'Il codice fiscale deve essere lungo 16 caratteri.';
    }
    cf = cf.toUpperCase();
    // Controllo che l'anno sia espresso in numero
    if (!/[0-9L-V]{2}/.test(cf.slice(6, 8))) {
      return 'Il codice fiscale non è valido. (anno di nascita non corretto)';
    }
    // Controllo che il giorno sia espresso in numero
    if (!/[0-9L-V]{2}/.test(cf.slice(9, 11))) {
      return 'Il codice fiscale non è valido. (giorno di nascita non corretto)';
    }
    // Controllo che il codice belfiore sia espresso in numero
    if (!/[0-9L-V]{3}/.test(cf.slice(12, 15))) {
      return 'Il codice fiscale non è valido. (codice belfiore non corretto)';
    }
    let checkDigit = 0;
    // pari
    for (let index = 1; index < 15; index += 2 ) {
      checkDigit += this.valore(cf, index, CodiceFiscaleValidator.valoriPari);
    }
    /* dispari */
    for (let index = 0; index < 15; index += 2 ) {
      checkDigit += this.valore(cf, index, CodiceFiscaleValidator.valoriDispari);
    }
    checkDigit = checkDigit % 26;
    if (cf.charAt(15) !== CodiceFiscaleValidator.tuttiCaratteri.charAt(checkDigit + 10) ) {
      return 'Il codice fiscale non è valido.';
    }
    return null;
  }
  validate(control: AbstractControl): ValidationErrors {
    const test = CodiceFiscaleValidator.verificaCodiceFiscale(control.value);
    return  test === null ? null : {'codiceFiscale': test };
  }
}
