import { SortEvent } from './sort-event';

export interface PaginationDataChange {
  limit: number;
  offset: number;
  page: number;
  sort: SortEvent;
}
