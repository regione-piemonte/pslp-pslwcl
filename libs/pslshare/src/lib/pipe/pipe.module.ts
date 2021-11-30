import { NgModule } from '@angular/core';
import { EscapeHtmlPipe } from './escape-html.pipe';
import { ExcludeKeysPipe } from './exclude-keys.pipe';
import { NotErrorObjectPipe } from './not-error-object.pipe';
import { PadNumberPipe } from './pad-number.pipe';
import { SiNoPipe } from './si-no.pipe';

@NgModule({
  declarations: [
    EscapeHtmlPipe,
    ExcludeKeysPipe,
    NotErrorObjectPipe,
    PadNumberPipe,
    SiNoPipe
  ],
  exports: [
    EscapeHtmlPipe,
    ExcludeKeysPipe,
    NotErrorObjectPipe,
    PadNumberPipe,
    SiNoPipe
  ]
})
export class PipeModule { }
