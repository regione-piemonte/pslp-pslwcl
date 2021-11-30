import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatiComponenteCurriculare } from '../dati-curriculari.component';

@Component({
  selector: 'pslfcwcl-panel-title',
  templateUrl: './panel-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanelTitleComponent implements OnInit {

  @Input() title: string;
  @Input() datiComponenteCurriculare: DatiComponenteCurriculare;

  constructor() { }

  ngOnInit() {
  }

}
