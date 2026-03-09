import { api } from './api.service';

export interface RegisterInput {
  employeeId: number;
  firstName: string;
  lastName: string;
  sssNumber: string;
  emailAddress: string;
  password: string;
}

export const accountService = {
  register: async (input: RegisterInput) => {
    // Adjust the endpoint and payload as needed for your backend
    const response = await api.post('/api/services/app/Account/Register', input);
    return response.data;
  },
  /**
   * Resets a user's password using AccountAppService.ResetPassword
   * @param userId
   * @param password
   * @param code (encrypted string from query param 'c', if present)
   */
  resetPassword: async (userId: number, password: string, code?: string) => {
    // code = encrypted string from query param 'c', if present
    // If code is present, send as 'c', otherwise send userId and resetCode
    const payload: any = {
      userId,
      password,
    };
    if (code) {
      payload.c = code;
    }
    // If you have a resetCode, you may add it here as well (if needed)
    const response = await api.post('/api/services/app/Account/ResetPassword', payload);
    return response.data;
  },
};
