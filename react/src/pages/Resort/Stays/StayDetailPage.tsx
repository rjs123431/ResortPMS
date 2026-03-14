import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import { AddPaymentDialog } from '../Shared/AddPaymentDialog';
import { CompleteGuestRequestDialog } from '../Shared/CompleteGuestRequestDialog';
import { GuestRequestDialog, GUEST_REQUEST_TYPE_OPTIONS } from '../Shared/GuestRequestDialog';
import { PostChargeDialog } from '../Shared/PostChargeDialog';
import { RoomChangeRequestDialog, ROOM_CHANGE_REASON_OPTIONS, ROOM_CHANGE_SOURCE_OPTIONS } from '../Shared/RoomChangeRequestDialog';
import {
  GuestRequestType,
  RoomChangeSource,
  RoomChangeReason,
  RoomChangeRequestStatus,
  type StayRoomRecordDto,
} from '@/types/resort.types';

const getRequestTypeLabels = (value: GuestRequestType) => {
  const labels = GUEST_REQUEST_TYPE_OPTIONS
    .filter((option) => (value & option.value) === option.value)
    .map((option) => option.label);

  return labels.length > 0 ? labels.join(', ') : 'None';
};

const toDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const toDateOnly = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
};

const getTransactionTypeLabel = (value: number) => {
  switch (value) {
    case 0:
      return 'Charge';
    case 1:
      return 'Payment';
    case 2:
      return 'Discount';
    case 3:
      return 'Adjustment';
    case 4:
      return 'Refund';
    case 5:
      return 'Deposit Payment';
    case 6:
      return 'Deposit Refund';
    case 7:
      return 'Write-Off';
    default:
      return `Type ${value}`;
  }
};

const parseRooms = (roomValue?: string) => {
  if (!roomValue) return [];
  const parts = roomValue
    .split(/[\n,|;/+&]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(parts));
};

export const StayDetailPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { stayId = '' } = useParams<{ stayId: string }>();

  const [showPostChargeDialog, setShowPostChargeDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showGuestRequestDialog, setShowGuestRequestDialog] = useState(false);
  const [showCompleteGuestRequestDialog, setShowCompleteGuestRequestDialog] = useState(false);
  const [showRoomChangeDialog, setShowRoomChangeDialog] = useState(false);
  const [selectedGuestRequestId, setSelectedGuestRequestId] = useState('');
  const [selectedRoomForTransfer, setSelectedRoomForTransfer] = useState<{ stayRoomId: string; roomNumber: string } | null>(null);

  const { data: stayLookup, isFetching: isFetchingStayLookup } = useQuery({
    queryKey: ['resort-stays-all-for-detail'],
    queryFn: () => resortService.getInHouseStays('', 0, 500),
  });

  const stay = useMemo(() => (stayLookup?.items ?? []).find((item) => item.id === stayId), [stayLookup?.items, stayId]);

  const { data: statement, isFetching: isFetchingStatement } = useQuery({
    queryKey: ['resort-statement', stayId],
    queryFn: () => resortService.getCheckoutStatement(stayId),
    enabled: !!stayId,
  });

  const { data: folio, isFetching: isFetchingFolio } = useQuery({
    queryKey: ['resort-folio-detail', stayId],
    queryFn: () => resortService.getFolio(stayId),
    enabled: !!stayId,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: chargeTypes } = useQuery({
    queryKey: ['resort-charge-types'],
    queryFn: () => resortService.getChargeTypes(),
  });

  const { data: guestRequests, isFetching: isFetchingGuestRequests } = useQuery({
    queryKey: ['resort-guest-requests', stayId],
    queryFn: () => resortService.getGuestRequests(stayId),
    enabled: !!stayId,
  });

  const { data: guestRequestCompletionContext, isFetching: isFetchingGuestRequestCompletionContext } = useQuery({
    queryKey: ['resort-guest-request-completion-context', selectedGuestRequestId],
    queryFn: () => resortService.getGuestRequestCompletionContext(selectedGuestRequestId),
    enabled: showCompleteGuestRequestDialog && !!selectedGuestRequestId,
  });

  const { data: roomChangeRequests, isFetching: isFetchingRoomChangeRequests } = useQuery({
    queryKey: ['resort-room-change-requests', stayId],
    queryFn: () => resortService.getRoomChangeRequestsByStay(stayId),
    enabled: !!stayId,
  });

  const stayRooms = useMemo(() => {
    const records = statement?.stayRooms ?? [];
    if (records.length > 0) return records;

    const fallbackAssignedAt = stay?.checkInDateTime ?? statement?.transactions?.[0]?.date ?? '';
    return parseRooms(statement?.roomNumber ?? stay?.roomNumber).map(
      (roomNumber): StayRoomRecordDto => ({
        stayRoomId: roomNumber,
        roomId: '',
        roomNumber,
        assignedAt: fallbackAssignedAt,
        releasedAt: undefined,
        isCleared: false,
      }),
    );
  }, [statement?.stayRooms, statement?.roomNumber, statement?.transactions, stay?.checkInDateTime, stay?.roomNumber]);

  const postChargeMutation = useMutation({
    mutationFn: (input: { chargeTypeId: string; amount: number; description: string }) =>
      resortService.postCharge({
        stayId,
        chargeTypeId: input.chargeTypeId,
        amount: input.amount,
        description: input.description || undefined,
      }),
    onSuccess: () => {
      setShowPostChargeDialog(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-folio-detail', stayId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-statement', stayId] });
    },
  });

  const postPaymentMutation = useMutation({
    mutationFn: (input: { paymentMethodId: string; amount: number; referenceNo: string }) =>
      resortService.postPayment({
        stayId,
        paymentMethodId: input.paymentMethodId,
        amount: input.amount,
        referenceNo: input.referenceNo || undefined,
      }),
    onSuccess: () => {
      setShowAddPaymentDialog(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-folio-detail', stayId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-statement', stayId] });
    },
  });

  const guestRequestMutation = useMutation({
    mutationFn: (input: { requestTypes: GuestRequestType[]; description: string }) =>
      resortService.addGuestRequest({
        stayId,
        requestTypes: input.requestTypes,
        description: input.description || undefined,
      }),
    onSuccess: () => {
      setShowGuestRequestDialog(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-guest-requests', stayId] });
    },
  });

  const completeGuestRequestMutation = useMutation({
    mutationFn: (input: { guestRequestId: string; remarks?: string }) =>
      resortService.completeGuestRequest(input),
    onSuccess: () => {
      setShowCompleteGuestRequestDialog(false);
      setSelectedGuestRequestId('');
      void queryClient.invalidateQueries({ queryKey: ['resort-guest-requests', stayId] });
    },
  });

  const transferRoomMutation = useMutation({
    mutationFn: (input: { source: RoomChangeSource; reason: RoomChangeReason; reasonDetails: string; toRoomId: string }) =>
      resortService.transferRoom({
        stayId,
        toRoomId: input.toRoomId,
        reason: `[${ROOM_CHANGE_SOURCE_OPTIONS.find((o) => o.value === input.source)?.label ?? 'Internal'}] ${
          ROOM_CHANGE_REASON_OPTIONS.find((o) => o.value === input.reason)?.label ?? 'Other'
        }${input.reasonDetails ? `: ${input.reasonDetails}` : ''}`,
      }),
    onSuccess: () => {
      setShowRoomChangeDialog(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-statement', stayId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-stays-all-for-detail'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-change-requests', stayId] });
    },
  });

  const getSourceLabel = (source: RoomChangeSource) =>
    ROOM_CHANGE_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? 'Unknown';

  const getReasonLabel = (reason: RoomChangeReason) =>
    ROOM_CHANGE_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? 'Unknown';

  const getStatusBadge = (status: RoomChangeRequestStatus) => {
    switch (status) {
      case RoomChangeRequestStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case RoomChangeRequestStatus.Approved:
        return 'bg-blue-100 text-blue-800';
      case RoomChangeRequestStatus.InProgress:
        return 'bg-purple-100 text-purple-800';
      case RoomChangeRequestStatus.Completed:
        return 'bg-green-100 text-green-800';
      case RoomChangeRequestStatus.Cancelled:
        return 'bg-gray-100 text-gray-800';
      case RoomChangeRequestStatus.Rejected:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RoomChangeRequestStatus) => {
    switch (status) {
      case RoomChangeRequestStatus.Pending:
        return 'Pending';
      case RoomChangeRequestStatus.Approved:
        return 'Approved';
      case RoomChangeRequestStatus.InProgress:
        return 'In Progress';
      case RoomChangeRequestStatus.Completed:
        return 'Completed';
      case RoomChangeRequestStatus.Cancelled:
        return 'Cancelled';
      case RoomChangeRequestStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stay Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View stay information, rooms, folio ledger, and guest requests.</p>
          </div>
          <button
            type="button"
            className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            onClick={() => navigate('/stays')}
          >
            Back To In-House Stays
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stay Information</h2>
          </div>

          {isFetchingStayLookup || isFetchingStatement ? (
            <p className="mt-3 text-sm text-gray-500">Loading stay info...</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
              <p><span className="font-medium">Stay ID:</span> {stayId || '-'}</p>
              <p><span className="font-medium">Stay No:</span> {stay?.stayNo ?? statement?.stayNo ?? '-'}</p>
              <p><span className="font-medium">Guest:</span> {stay?.guestName ?? statement?.guestName ?? '-'}</p>
              <p><span className="font-medium">Check-In:</span> {toDateTime(stay?.checkInDateTime)}</p>
              <p><span className="font-medium">Expected Check-Out:</span> {toDateTime(stay?.expectedCheckOutDateTime)}</p>
              <p><span className="font-medium">Folio:</span> {statement?.folioNo ?? folio?.folioNo ?? '-'}</p>
              <p><span className="font-medium">Balance:</span> {(folio?.balance ?? 0).toFixed(2)}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Assignments</h3>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left dark:border-gray-700">
                  <th className="p-2">Room</th>
                  <th className="p-2">Assigned</th>
                  <th className="p-2">Released</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {stayRooms.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={5}>No room assignments found.</td>
                  </tr>
                ) : (
                  stayRooms.map((room) => (
                    <tr className="border-b dark:border-gray-700" key={room.stayRoomId}>
                      <td className="p-2 font-medium">{room.roomNumber || '-'}</td>
                      <td className="p-2">{toDateTime(room.assignedAt)}</td>
                      <td className="p-2">{room.releasedAt ? toDateTime(room.releasedAt) : '-'}</td>
                      <td className="p-2">
                        {room.releasedAt ? (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Released</span>
                        ) : (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span>
                        )}
                      </td>
                      <td className="p-2">
                        {!room.releasedAt && (
                          <button
                            type="button"
                            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                            onClick={() => {
                              setSelectedRoomForTransfer({ stayRoomId: room.stayRoomId, roomNumber: room.roomNumber });
                              setShowRoomChangeDialog(true);
                            }}
                          >
                            Transfer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {(roomChangeRequests ?? []).length > 0 && (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Room Change History</h2>
            {isFetchingRoomChangeRequests ? (
              <p className="mt-3 text-sm text-gray-500">Loading room change history...</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Requested</th>
                      <th className="p-2">Source</th>
                      <th className="p-2">Reason</th>
                      <th className="p-2">From</th>
                      <th className="p-2">To</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(roomChangeRequests ?? []).map((req) => (
                      <tr className="border-b dark:border-gray-700" key={req.id}>
                        <td className="p-2">{toDateTime(req.requestedAt)}</td>
                        <td className="p-2">{getSourceLabel(req.source)}</td>
                        <td className="p-2">{getReasonLabel(req.reason)}</td>
                        <td className="p-2">{req.fromRoomNumber || '-'}</td>
                        <td className="p-2">{req.toRoomNumber || '-'}</td>
                        <td className="p-2">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getStatusBadge(req.status)}`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folio Ledger</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-primary-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => setShowPostChargeDialog(true)}
                disabled={!stayId}
              >
                Post Charge
              </button>
              <button
                type="button"
                className="rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => setShowAddPaymentDialog(true)}
                disabled={!stayId}
              >
                Add Payment
              </button>
            </div>
          </div>
          {isFetchingFolio || !folio ? (
            <p className="text-sm text-gray-500">Loading folio ledger...</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Folio {folio.folioNo} | Balance: {folio.balance.toFixed(2)}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folio.transactions.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={4}>No folio transactions yet.</td>
                      </tr>
                    ) : (
                      folio.transactions.map((transaction) => (
                        <tr className="border-b dark:border-gray-700" key={transaction.id}>
                          <td className="p-2">{toDateTime(transaction.transactionDate)}</td>
                          <td className="p-2">{transaction.chargeTypeName || getTransactionTypeLabel(transaction.transactionType)}</td>
                          <td className="p-2">{transaction.description || '-'}</td>
                          <td className="p-2 text-right">{transaction.netAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Paid Date</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Reference</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folio.payments.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={4}>No payments posted yet.</td>
                      </tr>
                    ) : (
                      folio.payments.map((payment) => (
                        <tr className="border-b dark:border-gray-700" key={payment.id}>
                          <td className="p-2">{toDateOnly(payment.paidDate)}</td>
                          <td className="p-2">{payment.paymentMethodName || '-'}</td>
                          <td className="p-2">{payment.referenceNo || '-'}</td>
                          <td className="p-2 text-right">{payment.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Guest Requests</h2>
            <button
              type="button"
              className="rounded bg-amber-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => setShowGuestRequestDialog(true)}
              disabled={!stayId}
            >
              Add Guest Request
            </button>
          </div>
          {isFetchingGuestRequests ? (
            <p className="text-sm text-gray-500">Loading guest requests...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Requested</th>
                    <th className="p-2">Types</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Completed</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(guestRequests ?? []).length === 0 ? (
                    <tr>
                      <td className="p-2 text-gray-500" colSpan={6}>No guest requests yet.</td>
                    </tr>
                  ) : (
                    (guestRequests ?? []).map((request) => (
                      <tr className="border-b dark:border-gray-700" key={request.id}>
                        <td className="p-2">{toDateTime(request.requestedAt)}</td>
                        <td className="p-2">{getRequestTypeLabels(request.requestTypes)}</td>
                        <td className="p-2">{request.description || '-'}</td>
                        <td className="p-2">{request.status}</td>
                        <td className="p-2">{request.completedAt ? toDateTime(request.completedAt) : '-'}</td>
                        <td className="p-2">
                          {request.status.toLowerCase() === 'completed' ? (
                            <span className="text-xs text-gray-500">Completed</span>
                          ) : (
                            <button
                              type="button"
                              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                              onClick={() => {
                                setSelectedGuestRequestId(request.id);
                                setShowCompleteGuestRequestDialog(true);
                              }}
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <PostChargeDialog
        open={showPostChargeDialog}
        chargeTypes={chargeTypes ?? []}
        isSaving={postChargeMutation.isPending}
        onClose={() => setShowPostChargeDialog(false)}
        onSave={(values) => postChargeMutation.mutate(values)}
      />

      <AddPaymentDialog
        open={showAddPaymentDialog}
        paymentMethods={paymentMethods ?? []}
        onClose={() => setShowAddPaymentDialog(false)}
        onSave={(values) => {
          postPaymentMutation.mutate({
            paymentMethodId: values.paymentMethodId,
            amount: values.amount,
            referenceNo: values.referenceNo,
          });
        }}
      />

      <GuestRequestDialog
        open={showGuestRequestDialog}
        isSaving={guestRequestMutation.isPending}
        onClose={() => setShowGuestRequestDialog(false)}
        onSave={(values) => guestRequestMutation.mutate(values)}
      />

      <CompleteGuestRequestDialog
        open={showCompleteGuestRequestDialog}
        context={guestRequestCompletionContext}
        isLoading={isFetchingGuestRequestCompletionContext}
        isSaving={completeGuestRequestMutation.isPending}
        onClose={() => {
          setShowCompleteGuestRequestDialog(false);
          setSelectedGuestRequestId('');
        }}
        onComplete={(remarks) => {
          if (!selectedGuestRequestId) return;
          completeGuestRequestMutation.mutate({
            guestRequestId: selectedGuestRequestId,
            remarks,
          });
        }}
      />

      <RoomChangeRequestDialog
        open={showRoomChangeDialog}
        stayId={stayId}
        stayRoomId={selectedRoomForTransfer?.stayRoomId}
        currentRoomNumber={selectedRoomForTransfer?.roomNumber}
        isSaving={transferRoomMutation.isPending}
        onClose={() => {
          setShowRoomChangeDialog(false);
          setSelectedRoomForTransfer(null);
        }}
        onSave={(values) => transferRoomMutation.mutate(values)}
      />
    </MainLayout>
  );
};
