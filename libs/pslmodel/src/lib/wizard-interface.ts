import { TypeExit } from './type-exit';

export interface WizardInterface {
    path: string;
    text: string;
    li: string;
    span: string;
    exitNav?:  TypeExit;
  }
