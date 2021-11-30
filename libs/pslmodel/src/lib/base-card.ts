import { TypeLinkCard } from './type-link-card';
import { TypeApplicationCard } from './type-application-card';

export interface BaseCard {
    id?: string;
    titolo?: string;
    link?: string;
    testoCard?: string;
    urlImg?: string;
    icon?: string;
    tipoLink?: TypeLinkCard;
    applicazione?: TypeApplicationCard;
    flgAccessoAutenticato?: boolean;
  }
