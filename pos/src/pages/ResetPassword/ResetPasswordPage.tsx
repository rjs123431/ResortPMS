
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { accountService } from '../../services/account.service';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { ServerConnectivityBanner } from '../../components/common/ServerConnectivityBanner';
import { CompanyLogoHeader } from '../../components/common/CompanyLogoHeader';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Get userId or code from query params
    const userIdParam = searchParams.get('userId');
    const code = searchParams.get('c');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== passwordRepeat) {
            setError('Passwords do not match');
            return;
        }
        setSubmitting(true);
        try {
            await accountService.resetPassword(Number(userIdParam), password, code || '');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err?.response?.data?.error?.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:flex-1 bg-[#0063a1] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '48px 48px'
                        }}></div>
                    </div>
                    <div className="relative flex flex-col items-center justify-center w-full px-8">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src="/logo.png"
                                alt="Company logo"
                                className="h-14 w-auto object-contain"
                            />
                            <span className="text-3xl font-bold text-white">PMS</span>
                        </div>
                        <p className="text-blue-200 text-center text-lg">
                            Payroll solutions at your fingertips.
                        </p>
                    </div>
                </div>

                {/* Right Side - Success Message */}
                <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <CompanyLogoHeader />

                        <div className="mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
                                Password Reset Successful
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
                                Your password has been reset. Redirecting to login...
                            </p>
                        </div>

                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                            <p className="text-sm text-green-800 dark:text-green-400">
                                Password reset successful! You will be redirected to the login page shortly.
                            </p>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-sm text-primary-600 hover:text-primary-500"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                <ThemeToggle />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:flex-1 bg-[#0063a1] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '48px 48px'
                    }}></div>
                </div>
                <div className="relative flex flex-col items-center justify-center w-full px-8">
                    <div className="flex items-center space-x-3 mb-4">
                        <img
                            src="/logo.png"
                            alt="Company logo"
                            className="h-14 w-auto object-contain"
                        />
                        <span className="text-3xl font-bold text-white">PMS</span>
                    </div>
                    <p className="text-blue-200 text-center text-lg">
                        Payroll solutions at your fingertips.
                    </p>
                </div>
            </div>

            {/* Right Side - Reset Password Form */}
            <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <CompanyLogoHeader />

                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
                            Reset Password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
                            You are only one step away from your new password, recover your password now.
                        </p>
                    </div>

                    <ServerConnectivityBanner />

                    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                New Password<span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="passwordRepeat" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Confirm Password<span className="text-red-500">*</span>
                            </label>
                            <input
                                id="passwordRepeat"
                                name="passwordRepeat"
                                type="password"
                                required
                                value={passwordRepeat}
                                onChange={e => setPasswordRepeat(e.target.value)}
                                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={submitting}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !password || !passwordRepeat}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Changing...' : 'Change password'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-primary-600 hover:text-primary-500"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            <ThemeToggle />
        </div>
    );
};

export default ResetPasswordPage;
