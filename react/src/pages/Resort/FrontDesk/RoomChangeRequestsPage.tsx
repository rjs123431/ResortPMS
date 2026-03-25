import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { roomChangeService } from '@services/room-change.service';
import {
  RoomChangeSource,
  RoomChangeReason,
  RoomChangeRequestStatus,
  type RoomChangeRequestListDto,
  type RoomChangeRequestDto,
  type AvailableRoomForChangeDto,
} from '@/types/room-change.types'
import { HousekeepingStatus } from '@/types/room.types';
import { formatMoney } from '@utils/helpers';

const SOURCE_LABELS: Record<RoomChangeSource, string> = {
  [RoomChangeSource.GuestRequest]: 'Guest Request',
  [RoomChangeSource.Internal]: 'Internal',
  [RoomChangeSource.Maintenance]: 'Maintenance',
  [RoomChangeSource.Upgrade]: 'Upgrade',
  [RoomChangeSource.Downgrade]: 'Downgrade',
};

const REASON_LABELS: Record<RoomChangeReason, string> = {
  [RoomChangeReason.GuestPreference]: 'Guest Preference',
  [RoomChangeReason.RoomIssue]: 'Room Issue',
  [RoomChangeReason.Maintenance]: 'Maintenance',
  [RoomChangeReason.Noise]: 'Noise',
  [RoomChangeReason.ViewChange]: 'View Change',
  [RoomChangeReason.Accessibility]: 'Accessibility',
  [RoomChangeReason.FamilyReunion]: 'Family Reunion',
  [RoomChangeReason.Upgrade]: 'Upgrade',
  [RoomChangeReason.Downgrade]: 'Downgrade',
  [RoomChangeReason.Overbooking]: 'Overbooking',
  [RoomChangeReason.Other]: 'Other',
};

const STATUS_BADGES: Record<RoomChangeRequestStatus, string> = {
  [RoomChangeRequestStatus.Pending]: 'bg-yellow-100 text-yellow-800',
  [RoomChangeRequestStatus.Approved]: 'bg-blue-100 text-blue-800',
  [RoomChangeRequestStatus.InProgress]: 'bg-purple-100 text-purple-800',
  [RoomChangeRequestStatus.Completed]: 'bg-green-100 text-green-800',
  [RoomChangeRequestStatus.Cancelled]: 'bg-gray-100 text-gray-800',
  [RoomChangeRequestStatus.Rejected]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<RoomChangeRequestStatus, string> = {
  [RoomChangeRequestStatus.Pending]: 'Pending',
  [RoomChangeRequestStatus.Approved]: 'Approved',
  [RoomChangeRequestStatus.InProgress]: 'In Progress',
  [RoomChangeRequestStatus.Completed]: 'Completed',
  [RoomChangeRequestStatus.Cancelled]: 'Cancelled',
  [RoomChangeRequestStatus.Rejected]: 'Rejected',
};

const HK_STATUS_LABELS: Record<HousekeepingStatus, string> = {
  [HousekeepingStatus.Clean]: 'Clean',
  [HousekeepingStatus.Dirty]: 'Dirty',
  [HousekeepingStatus.Inspected]: 'Inspected',
  [HousekeepingStatus.Pickup]: 'Pickup',
};

const HK_STATUS_COLORS: Record<HousekeepingStatus, string> = {
  [HousekeepingStatus.Clean]: 'bg-green-100 text-green-800',
  [HousekeepingStatus.Dirty]: 'bg-red-100 text-red-800',
  [HousekeepingStatus.Inspected]: 'bg-blue-100 text-blue-800',
  [HousekeepingStatus.Pickup]: 'bg-yellow-100 text-yellow-800',
};

export const RoomChangeRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests, isFetching } = useQuery<RoomChangeRequestListDto[]>({
    queryKey: ['room-change-requests-pending'],
    queryFn: () => roomChangeService.getPendingRoomChangeRequests(),
  });

  const { data: requestDetail } = useQuery<RoomChangeRequestDto>({
    queryKey: ['room-change-request-detail', selectedRequestId],
    queryFn: () => roomChangeService.getRoomChangeRequest(selectedRequestId!),
    enabled: !!selectedRequestId,
  });

  const { data: availableRooms } = useQuery<AvailableRoomForChangeDto[]>({
    queryKey: ['room-change-available-rooms', selectedRequestId],
    queryFn: () => roomChangeService.getAvailableRoomsForChange(selectedRequestId!),
    enabled: !!selectedRequestId && actionMode === 'approve',
  });

  const approveMutation = useMutation({
    mutationFn: (input: { requestId: string; toRoomId: string }) =>
      roomChangeService.approveRoomChangeRequest(input),
    onSuccess: () => {
      setSelectedRequestId(null);
      setActionMode(null);
      setSelectedRoomId('');
      void queryClient.invalidateQueries({ queryKey: ['room-change-requests-pending'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (input: { requestId: string; rejectionReason: string }) =>
      roomChangeService.rejectRoomChangeRequest(input),
    onSuccess: () => {
      setSelectedRequestId(null);
      setActionMode(null);
      setRejectionReason('');
      void queryClient.invalidateQueries({ queryKey: ['room-change-requests-pending'] });
    },
  });

  const handleOpenApprove = (requestId: string) => {
    setSelectedRequestId(requestId);
    setActionMode('approve');
    setSelectedRoomId('');
  };

  const handleOpenReject = (requestId: string) => {
    setSelectedRequestId(requestId);
    setActionMode('reject');
    setRejectionReason('');
  };

  const handleClose = () => {
    setSelectedRequestId(null);
    setActionMode(null);
    setSelectedRoomId('');
    setRejectionReason('');
  };

  const pendingList = (requests ?? []).filter((r) => r.status === RoomChangeRequestStatus.Pending);
  const otherList = (requests ?? []).filter((r) => r.status !== RoomChangeRequestStatus.Pending);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Change Requests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and manage all pending room change requests across in-house stays.
            </p>
          </div>
        </div>

        {isFetching ? (
          <p className="text-sm text-gray-500">Loading room change requests...</p>
        ) : pendingList.length === 0 && otherList.length === 0 ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">No pending room change requests.</p>
          </section>
        ) : (
          <>
            {pendingList.length > 0 && (
              <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Approval ({pendingList.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left dark:border-gray-700">
                        <th className="p-2">Stay #</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Reason</th>
                        <th className="p-2">From Room</th>
                        <th className="p-2">Requested</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingList.map((req) => (
                        <tr className="border-b dark:border-gray-700" key={req.id}>
                          <td className="p-2">
                            <button
                              type="button"
                              className="text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400"
                              onClick={() => navigate(`/front-desk/stays/${req.id}`)}
                            >
                              {req.stayNo}
                            </button>
                          </td>
                          <td className="p-2">{req.guestName}</td>
                          <td className="p-2">{SOURCE_LABELS[req.source] ?? 'Unknown'}</td>
                          <td className="p-2">{REASON_LABELS[req.reason] ?? 'Unknown'}</td>
                          <td className="p-2 font-medium">{req.fromRoomNumber}</td>
                          <td className="p-2 text-gray-500">{new Date(req.requestedAt).toLocaleString()}</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700"
                                onClick={() => handleOpenApprove(req.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                                onClick={() => handleOpenReject(req.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {otherList.length > 0 && (
              <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Other Requests ({otherList.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left dark:border-gray-700">
                        <th className="p-2">Stay #</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">From → To</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherList.map((req) => (
                        <tr className="border-b dark:border-gray-700" key={req.id}>
                          <td className="p-2">{req.stayNo}</td>
                          <td className="p-2">{req.guestName}</td>
                          <td className="p-2">{SOURCE_LABELS[req.source] ?? 'Unknown'}</td>
                          <td className="p-2">
                            {req.fromRoomNumber} → {req.toRoomNumber || '—'}
                          </td>
                          <td className="p-2">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[req.status] ?? 'bg-gray-100 text-gray-800'}`}>
                              {STATUS_LABELS[req.status] ?? 'Unknown'}
                            </span>
                          </td>
                          <td className="p-2 text-gray-500">{new Date(req.requestedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={actionMode === 'approve' && !!selectedRequestId} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <DialogTitle className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Approve Room Change Request
            </DialogTitle>

            {requestDetail && (
              <div className="mb-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Guest:</span> {requestDetail.guestName}</p>
                <p><span className="font-medium">From:</span> {requestDetail.fromRoomNumber} ({requestDetail.fromRoomTypeName})</p>
                <p><span className="font-medium">Source:</span> {SOURCE_LABELS[requestDetail.source] ?? 'Unknown'}</p>
                <p><span className="font-medium">Reason:</span> {REASON_LABELS[requestDetail.reason] ?? 'Unknown'}{requestDetail.reasonDetails ? ` — ${requestDetail.reasonDetails}` : ''}</p>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assign To Room <span className="text-red-500">*</span>
            </label>
            {!availableRooms ? (
              <p className="mt-1 text-sm text-gray-500">Loading available rooms...</p>
            ) : availableRooms.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">No available rooms found.</p>
            ) : (
              <div className="mt-2 max-h-60 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left"></th>
                      <th className="p-2 text-left">Room</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Rate</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Move</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {availableRooms.map((room) => (
                      <tr
                        key={room.roomId}
                        className={`cursor-pointer transition ${selectedRoomId === room.roomId ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedRoomId(room.roomId)}
                      >
                        <td className="p-2">
                          <input
                            type="radio"
                            name="targetRoom"
                            checked={selectedRoomId === room.roomId}
                            onChange={() => setSelectedRoomId(room.roomId)}
                            className="h-4 w-4 text-primary-600"
                          />
                        </td>
                        <td className="p-2 font-medium">{room.roomNumber}</td>
                        <td className="p-2">{room.roomTypeName}</td>
                        <td className="p-2">{formatMoney(room.baseRate)}</td>
                        <td className="p-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${HK_STATUS_COLORS[room.housekeepingStatus] ?? 'bg-gray-100 text-gray-800'}`}>
                            {HK_STATUS_LABELS[room.housekeepingStatus] ?? '—'}
                          </span>
                        </td>
                        <td className="p-2">
                          {room.isUpgrade && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Upgrade</span>}
                          {room.isDowngrade && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">Downgrade</span>}
                          {room.isSameType && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">Same</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedRoomId || approveMutation.isPending}
                className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                onClick={() => {
                  if (!selectedRequestId || !selectedRoomId) return;
                  approveMutation.mutate({ requestId: selectedRequestId, toRoomId: selectedRoomId });
                }}
              >
                {approveMutation.isPending ? 'Approving…' : 'Approve & Assign'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionMode === 'reject' && !!selectedRequestId} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <DialogTitle className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Reject Room Change Request
            </DialogTitle>

            {requestDetail && (
              <div className="mb-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Guest:</span> {requestDetail.guestName}</p>
                <p><span className="font-medium">From:</span> {requestDetail.fromRoomNumber}</p>
                <p><span className="font-medium">Reason:</span> {REASON_LABELS[requestDetail.reason] ?? 'Unknown'}</p>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => {
                  if (!selectedRequestId || !rejectionReason.trim()) return;
                  rejectMutation.mutate({ requestId: selectedRequestId, rejectionReason: rejectionReason.trim() });
                }}
              >
                {rejectMutation.isPending ? 'Rejecting…' : 'Reject Request'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
