import { Component, OnInit, Directive, TemplateRef, Input, Output, EventEmitter, ViewChildren, QueryList, ContentChild } from '@angular/core';
import { PaginationDataChange, SortEvent } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328
import { SortableDirective } from './sortable.directive';

@Directive({selector: 'ng-template[pslbasepagePaginationHead]'})
export class PaginationHeadDirective {
  constructor(
    public templateRef: TemplateRef<{}>
  ) {}
}

@Directive({selector: 'ng-template[pslbasepagePaginationBody]'})
export class PaginationBodyDirective<T> {
  constructor(
    public templateRef: TemplateRef<{$implicit: T}>
  ) {}
}

@Component({
  selector: 'pslshare-paginated-table',
  templateUrl: './paginated-table.component.html'
})
export class PaginatedTableComponent<T> implements OnInit {

  @Input() pagedResponse: T[];
  @Input() columnNumber = 0;
  @Input() limit = 10;
  @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();

  @ViewChildren(SortableDirective) headers: QueryList<SortableDirective>;
  @ContentChild(PaginationHeadDirective, {static: false}) tplHead: PaginationHeadDirective;
  @ContentChild(PaginationBodyDirective, {static: false}) tplBody: PaginationBodyDirective<T>;

  pageSizes: number[] = [1, 5, 10, 20, 50];
  page: number;
  sort: SortEvent;
  totalPages: number;

  constructor() { }

  ngOnInit() {
    this.page = 1;
    if (!this.pagedResponse) {
      this.pagedResponse = [];
    }
    this.totalPages = Math.ceil(this.pagedResponse.length / this.limit);
    if (!this.columnNumber) {
      this.columnNumber = 0;
    }
  }

  changePageSize(pageSize: number) {
    const currentFirstElement = (this.page - 1) * this.limit;
    this.limit = pageSize;
    const page = Math.floor(currentFirstElement / this.limit);
    const offset = page * this.limit;
    this.page = page + 1;

    this.changePaginationData.emit({
      limit: this.limit,
      sort: this.sort,
      page,
      offset
    });
  }
  onSort(sortEvent: SortEvent) {
    this.headers
      .filter(header => header.sortable !== sortEvent.column)
      .forEach(header => header.direction = '');
    this.sort = sortEvent;
    this.changePaginationData.emit({
      limit: this.limit,
      sort: this.sort,
      page: this.page - 1,
      offset: (this.page - 1) * this.limit
    });
  }

  goToPage(pageNumber: number): void {
    const totalPages = Math.ceil(this.pagedResponse.length / this.limit);
    this.page = Math.max(1, Math.min(totalPages, pageNumber));

    this.changePaginationData.emit({
      limit: this.limit,
      sort: this.sort,
      page: this.page - 1,
      offset: (this.page - 1) * this.limit
    });
  }

  get pageSlice(): T[] {
    return this.pagedResponse.slice((this.page - 1) * this.limit, this.page * this.limit);
  }

  get paginationFooter(): string {
    if (this.pagedResponse.length === 0) {
      return '';
    }
    const first = Math.min((this.page - 1) * this.limit + 1, this.pagedResponse.length);
    const last = Math.min(this.page * this.limit, this.pagedResponse.length);
    return `${first} - ${last} di ${this.pagedResponse.length} elementi`;
  }

}
