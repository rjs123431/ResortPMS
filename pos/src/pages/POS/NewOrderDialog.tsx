import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PosOutletListDto, PosTableListDto } from '@/types/pos.types';
import { PosOrderType } from '@/types/pos.types';
import type { StaffListDto } from '@/types/resort.types';

const ORDER_TYPE_LABELS: Record<number, string> = {
  [PosOrderType.DineIn]: 'Dine-in',
  [PosOrderType.Takeaway]: 'Takeaway',
  [PosOrderType.RoomCharge]: 'Room Charge',
  [PosOrderType.PoolService]: 'Pool Service',
  [PosOrderType.RoomService]: 'Room Service',
};

export interface NewOrderDialogProps {
  open: boolean;
  onClose: () => void;
  outletId: string;
  setOutletId: (id: string) => void;
  orderType: number;
  setOrderType: (value: number) => void;
  tableId: string;
  setTableId: (id: string) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  roomNumber: string;
  setRoomNumber: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  serverStaffId: string;
  setServerStaffId: (id: string) => void;
  staffList: StaffListDto[];
  outlets: PosOutletListDto[];
  tables: PosTableListDto[];
  onConfirm: () => void;
}

const tileBase =
  'rounded-lg border-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800';
const tileSelected =
  'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300';
const tileUnselected =
  'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600';

export const NewOrderDialog = ({
  open,
  onClose,
  outletId,
  setOutletId,
  orderType,
  setOrderType,
  tableId,
  setTableId,
  guestName,
  setGuestName,
  roomNumber,
  setRoomNumber,
  notes,
  setNotes,
  serverStaffId,
  setServerStaffId,
  staffList,
  outlets,
  tables,
  onConfirm,
}: NewOrderDialogProps) => {
  const [showServerPopup, setShowServerPopup] = useState(false);
  const selectedStaff = staffList.find((s) => s.id === serverStaffId);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (showServerPopup) {
        setShowServerPopup(false);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showServerPopup, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pt-8 pb-8 pointer-events-none">
        <DialogPanel className="flex max-h-[calc(100vh-4rem)] w-full max-w-2xl shrink-0 flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              New Order
            </DialogTitle>
          <select
            value={outletId}
            onChange={(e) => {
              setOutletId(e.target.value);
              setTableId('');
            }}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select outlet</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setOrderType(Number(k))}
                    className={`flex min-h-[3rem] items-center justify-center px-4 py-3 ${tileBase} ${orderType === Number(k) ? tileSelected : tileUnselected
                      }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {orderType === PosOrderType.DineIn && (
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Table #</span>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                  <button
                    type="button"
                    onClick={() => setTableId('')}
                    className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${tableId === '' ? tileSelected : tileUnselected
                      }`}
                  >
                    None
                  </button>
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTableId(t.id)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${tableId === t.id ? tileSelected : tileUnselected
                        }`}
                    >
                      {t.tableNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Server (optional)
              </label>
              <button
                type="button"
                onClick={() => setShowServerPopup(true)}
                className="w-full rounded border border-gray-300 p-2 text-left dark:border-gray-600 dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {selectedStaff ? selectedStaff.fullName : 'No server'}
              </button>
            </div>

            <Dialog open={showServerPopup} onClose={() => {}} className="relative z-[60]">
              <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
              <div className="fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
                <DialogPanel className="max-h-[80vh] w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
                  <DialogTitle as="h4" className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                    Select server
                  </DialogTitle>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setServerStaffId('');
                        setShowServerPopup(false);
                      }}
                      className={`mb-1 w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition ${tileBase} ${!serverStaffId ? tileSelected : tileUnselected}`}
                    >
                      No server
                    </button>
                    {staffList.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setServerStaffId(s.id);
                          setShowServerPopup(false);
                        }}
                        className={`mb-1 w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition ${tileBase} ${serverStaffId === s.id ? tileSelected : tileUnselected}`}
                      >
                        {s.fullName}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowServerPopup(false)}
                      className="w-full rounded border border-gray-300 py-2 text-sm dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Guest name (optional)
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest name"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Room # (optional)
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="For room charge"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes…"
                rows={2}
                className="w-full resize-none rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!outletId}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              New Order
            </button>
          </div>
        </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
