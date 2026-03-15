

// Deprecated for reset password page. Still used by EditUserPasswordDialog.
import { api } from './api.service';

/**
 * For admin/user password reset (EditUserPasswordDialog)
 * @param userId
 * @param newPassword
 * @param yourPassword (admin's password)
 */
export const resetPassword = async (userId: number, newPassword: string, yourPassword: string) => {
	const response = await api.post('/api/services/app/User/ResetPassword', {
		userId,
		newPassword,
		adminPassword: yourPassword,
	});
	return response.data;
};
