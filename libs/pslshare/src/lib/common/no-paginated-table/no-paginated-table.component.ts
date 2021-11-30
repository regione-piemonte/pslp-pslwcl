import { Component, ContentChild, Directive, Input, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { SortEvent } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { SortableDirective } from '../paginated-table/sortable.directive';

@Directive({ selector: 'ng-template[pslbasepageNoPaginationHead]' })
export class NoPaginationHeadDirective {
  constructor(
    public templateRef: TemplateRef<{}>
  ) { }
}

@Directive({ selector: 'ng-template[pslbasepageNoPaginationBody]' })
export class NoPaginationBodyDirective<T> {
  constructor(
    public templateRef: TemplateRef<{ $implicit: T }>
  ) { }
}

@Component({
  selector: 'pslshare-no-paginated-table',
  templateUrl: './no-paginated-table.component.html'
})
export class NoPaginatedTableComponent<T> implements OnInit {

  @Input() pagedResponse: T[];
  @Input() columnNumber = 0;

  @ViewChildren(SortableDirective) headers: QueryList<SortableDirective>;
  @ContentChild(NoPaginationHeadDirective, { static: false }) tplHead: NoPaginationHeadDirective;
  @ContentChild(NoPaginationBodyDirective, { static: false }) tplBody: NoPaginationBodyDirective<T>;

  page: number;
  sort: SortEvent;

  constructor() { }

  ngOnInit() {
    this.page = 1;
    if (!this.pagedResponse) {
      this.pagedResponse = [];
    }
    if (!this.columnNumber) {
      this.columnNumber = 0;
    }
  }

  onSort(sortEvent: SortEvent) {
    this.headers
      .filter(header => header.sortable !== sortEvent.column)
      .forEach(header => header.direction = '');
    this.sort = sortEvent;
  }

  get pageSlice(): T[] {
    return this.pagedResponse;
  }
}
