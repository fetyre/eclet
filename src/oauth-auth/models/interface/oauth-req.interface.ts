import { OAuthProvider } from 'src/auth/models/enums/oauth.provide.emun';
import { OAuthCreateUser } from './oauth-create.interface';

export interface OAuthReqInterface extends OAuthCreateUser {
	provider: OAuthProvider;
}