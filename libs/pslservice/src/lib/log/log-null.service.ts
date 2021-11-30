import { LogService } from './log.service';

export class LogNullService extends LogService {
  log(...msg: any[]): void {
    // Do nothing
  }
  error(...msg: any[]): void {
    // Do nothing
  }
}
