import { ConfirmPayload } from 'src/strategy/interface/confirm-stategy.interface';
import { UserWithEmailToken } from '../type/confirm-email.auth.type';

export interface ConfirmEmailReqInterface {
	user: UserWithEmailToken;
	payload: ConfirmPayload;
}
