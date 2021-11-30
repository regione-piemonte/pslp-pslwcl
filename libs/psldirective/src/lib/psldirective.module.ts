import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnoNotValidValidatorDirective } from './anno-not-valid-validator.directive';
import { CodiceFiscaleValidator } from './codice-fiscale-validator.directive';
import { DateFormatValidator } from './date-format-validator.directive';
import { DateValueValidator } from './date-value-validator.directive';
import { FnValidateDirective } from './fn-validate.directive';
import { IndirizzoValidator } from './indirizzo-validator.directive';
import { MaggiorenneValidator } from './maggiorenne-validator.directive';
import { MinorenneValidator } from './minorenne-validator.directive';
import { NumberNotValidValidatorDirective } from './number-not-valid.directive';
import { RadioLabelHandlerDirective } from './radio-label-handler.directive';
import { ValueNotPresentValidatorDirective } from './value-not-present.directive';
import { CodFiscOrPartIvaValidator } from './cod-fisc-or-part-iva-validator.directive';
import { IfOneThenFullValidator } from './if-one-then-full-validator.directive';
import { CodMinistNotValidValidatorDirective } from './qualifica-not-valid.directive';
import { FutureDateIsInvalidValidator } from './future-date-is-invalid-validator.directive';
import { ImportoEuroValidator } from './importo-euro-validator.directive';


@NgModule({
  declarations: [
    AnnoNotValidValidatorDirective,
    CodiceFiscaleValidator,
    CodFiscOrPartIvaValidator,
    IfOneThenFullValidator,
    DateFormatValidator,
    DateValueValidator,
    FnValidateDirective,
    IndirizzoValidator,
    MaggiorenneValidator,
    MinorenneValidator,
    NumberNotValidValidatorDirective,
    CodMinistNotValidValidatorDirective,
    RadioLabelHandlerDirective,
    ValueNotPresentValidatorDirective,
    FutureDateIsInvalidValidator,
    ImportoEuroValidator
  ],
  imports: [CommonModule],
  exports: [
    AnnoNotValidValidatorDirective,
    CodiceFiscaleValidator,
    CodFiscOrPartIvaValidator,
    IfOneThenFullValidator,
    DateFormatValidator,
    DateValueValidator,
    FnValidateDirective,
    IndirizzoValidator,
    MaggiorenneValidator,
    MinorenneValidator,
    NumberNotValidValidatorDirective,
    CodMinistNotValidValidatorDirective,
    RadioLabelHandlerDirective,
    ValueNotPresentValidatorDirective,
    FutureDateIsInvalidValidator,
    ImportoEuroValidator
  ]
})
export class PsldirectiveModule {}
