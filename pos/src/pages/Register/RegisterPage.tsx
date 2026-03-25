import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { ServerConnectivityBanner } from '@components/common/ServerConnectivityBanner';
import { CompanyLogoHeader } from '@components/common/CompanyLogoHeader';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sssLast4, setSssLast4] = useState('');

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
            Smart solutions at your fingertips.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-20 xl:px-24 min-h-0">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <CompanyLogoHeader />

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center lg:text-left">
              Employee Registration
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
              Please provide your details below.
            </p>
          </div>

          <ServerConnectivityBanner />

          <form className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                First Name<span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Last Name<span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="sssLast4" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Last 4-digit of SSS Number (numbers only)<span className="text-red-500">*</span>
              </label>
              <input
                id="sssLast4"
                name="sssLast4"
                type="text"
                required
                min={0}
                maxLength={4}
                value={sssLast4}
                onChange={(e) => setSssLast4(e.target.value.replace(/\D/g, ''))}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Registration Instructions
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mb-3 list-disc list-inside space-y-1">
              <li>Login to your personal email client (GMail, Yahoo, etc.)</li>
              <li>Email the following details to{' '}
                <a
                  href="mailto:simplesweldo@gmail.com"
                  className="font-medium underline hover:text-blue-600"
                >
                  simplesweldo@gmail.com
                </a>
                </li>
              <li>Subject: "Employee Registration - {firstName} {lastName}"</li>
              <li>Include the following information:</li>
            </ul>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>First Name:</strong> {firstName || 'Not provided'}</p>
              <p><strong>Last Name:</strong> {lastName || 'Not provided'}</p>
              <p><strong>Last 4-digit of SSS Number:</strong> {sssLast4 || 'Not provided'}</p>
            </div>
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
};