import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import type { StaffListDto } from '@/types/resort.types';

type ClearRoomDialogProps = {
  open: boolean;
  roomNumber: string;
  isClearing: boolean;
  onClose: () => void;
  onConfirm: (staffId?: string) => void;
};

export const ClearRoomDialog = ({ open, roomNumber, isClearing, onClose, onConfirm }: ClearRoomDialogProps) => {
  const [staffFilter, setStaffFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffListDto | null>(null);

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['clear-room-staff-search', staffFilter],
    queryFn: () => resortService.getStaffsPaged(staffFilter, 0, 50),
    enabled: open,
  });

  const staffItems = staffData?.items ?? [];

  const handleClose = () => {
    setSelectedStaff(null);
    setStaffFilter('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(selectedStaff?.id);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center bg-black/50 p-4 pt-6 md:pt-10">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Clear Room {roomNumber}
            </DialogTitle>
            <button
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={handleClose}
              type="button"
            >
              Close
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Select the staff member who inspected and cleared the room.
          </p>

          {selectedStaff ? (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700/40 dark:bg-emerald-900/20">
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Selected Staff</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {selectedStaff.fullName} ({selectedStaff.staffCode}) - {selectedStaff.department || 'No department'}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-emerald-600 underline hover:text-emerald-800 dark:text-emerald-400"
                onClick={() => setSelectedStaff(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  placeholder="Search by name, staff code, or department"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-800">
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Staff Code</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Department</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={4}>Loading staff...</td>
                      </tr>
                    ) : staffItems.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={4}>No staff found.</td>
                      </tr>
                    ) : (
                      staffItems.map((staff) => (
                        <tr className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50" key={staff.id}>
                          <td className="p-2">{staff.staffCode}</td>
                          <td className="p-2">{staff.fullName}</td>
                          <td className="p-2">{staff.department || '-'}</td>
                          <td className="p-2">
                            <button
                              type="button"
                              className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700"
                              onClick={() => setSelectedStaff(staff)}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={!selectedStaff || isClearing}
              onClick={handleConfirm}
            >
              {isClearing ? 'Clearing...' : 'Confirm Clear'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
