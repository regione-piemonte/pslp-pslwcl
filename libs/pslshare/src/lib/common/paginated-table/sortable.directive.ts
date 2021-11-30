import { Directive, HostBinding, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { SortDirection, SortEvent } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328

const rotate: {[key: string]: SortDirection} = { asc: 'desc', desc: '', '': 'asc' };

@Directive({
  selector: '[pslbasepageSortable]'
})
export class SortableDirective {

  @Input('pslbasepageSortable') sortable: string;
  @Input() direction: SortDirection = '';
  @Output() readonly sort = new EventEmitter<SortEvent>();

  @HostBinding('class.asc') get asc() { return this.direction === 'asc'; }
  @HostBinding('class.desc') get desc() { return this.direction === 'desc'; }

  constructor() { }

  @HostListener('click') rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({column: this.sortable, direction: this.direction});
  }

}
