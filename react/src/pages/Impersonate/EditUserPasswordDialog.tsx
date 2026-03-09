import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { resetPassword } from '@/services/resetPassword.service';

interface EditUserPasswordDialogProps {
  open: boolean;
  userId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserPasswordDialog: React.FC<EditUserPasswordDialogProps> = ({ open, userId, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [yourPassword, setYourPassword] = useState('');
  const [showYourPassword, setShowYourPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!yourPassword) {
      setError('Please enter your password.');
      return;
    }
    if (!userId) return;
    setSubmitting(true);
    try {
      await resetPassword(userId, password, yourPassword);
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setYourPassword('');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-auto p-6 z-50">
          <Dialog.Title className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Reset User Password</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">New Password</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Confirm Password</label>
              <input
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Your Password</label>
              <div className="relative flex items-center">
                <input
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 pr-10"
                  type={showYourPassword ? 'text' : 'password'}
                  value={yourPassword}
                  onChange={e => setYourPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 text-xs text-gray-500 dark:text-gray-300 focus:outline-none"
                  tabIndex={-1}
                  onClick={() => setShowYourPassword(v => !v)}
                >
                  {showYourPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
          {error && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-600 dark:text-green-400">Password reset successfully.</div>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={onClose}
              type="button"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
