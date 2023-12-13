import { IBrowserInfo } from './browser-info.interface';
import { IGeoLocation } from './geo-location.interface';

export interface ILoginInfo extends IBrowserInfo, IGeoLocation {}
