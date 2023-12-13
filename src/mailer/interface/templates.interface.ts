import { TemplateDelegate } from 'handlebars';
import { ITemplatedData } from './template-data.interface';
import { ILoginDetaildeInfo } from './login-detailde-info.interface';
import { ILofinGenericInfo } from './login-generic-info.interface';

export interface ITemplates {
	confirmation: TemplateDelegate<ITemplatedData>;
	resetPassword: TemplateDelegate<ITemplatedData>;
	afterPasswordResetAtLogin: TemplateDelegate;
	afterUserResetPassword: TemplateDelegate;
	afterUserResetEmail: TemplateDelegate<ITemplatedData>;
	confirmationAdminEmail: TemplateDelegate<ITemplatedData>;
	userReserPasswordCode: TemplateDelegate<ITemplatedData>;
	adModerationStatus: TemplateDelegate;
	informMessage: TemplateDelegate;
	loginInfoDetailed: TemplateDelegate<ILoginDetaildeInfo>;
	loginInfoGeneric: TemplateDelegate<ILofinGenericInfo>;
	singUpOAuth: TemplateDelegate;
}
