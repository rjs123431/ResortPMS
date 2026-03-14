import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import type { StaffListDto } from '@/types/resort.types';

type SearchStaffDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelectStaff: (staff: StaffListDto) => void;
};

export const SearchStaffDialog = ({ open, onClose, onSelectStaff }: SearchStaffDialogProps) => {
  const [staffFilter, setStaffFilter] = useState('');

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['housekeeping-staff-search', staffFilter],
    queryFn: () => resortService.getStaffsPaged(staffFilter, 0, 50),
    enabled: open,
  });

  const staffItems = staffData?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="flex min-h-screen items-start justify-center p-4 pt-6 md:pt-10">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">Search Staff</DialogTitle>
            <button
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={onClose}
              type="button"
            >
              x
            </button>
          </div>

          <div className="mb-4">
            <input
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              placeholder="Search by name, staff code, or department"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Staff Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Department</th>
                  <th className="p-2">Position</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={5}>Loading staff...</td>
                  </tr>
                ) : staffItems.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={5}>No staff found.</td>
                  </tr>
                ) : (
                  staffItems.map((staff) => (
                    <tr className="border-b" key={staff.id}>
                      <td className="p-2">{staff.staffCode}</td>
                      <td className="p-2">{staff.fullName}</td>
                      <td className="p-2">{staff.department || '-'}</td>
                      <td className="p-2">{staff.position || '-'}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                          onClick={() => {
                            onSelectStaff(staff);
                            onClose();
                          }}
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
        </DialogPanel>
      </div>
    </Dialog>
  );
};
