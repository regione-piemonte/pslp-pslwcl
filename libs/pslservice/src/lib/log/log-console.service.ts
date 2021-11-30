import { LogService } from './log.service';

export class LogConsoleService extends LogService {
  log(...msg: any[]): void {
    console.log(...msg);
  }
  error(...msg: any[]): void {
    console.error(...msg);
  }
}
