import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { conferenceBookingService } from '@services/conference-booking.service';
import { conferenceCompanyService } from '@services/conference-company.service';
import { conferenceExtraService } from '@services/conference-extra.service';
import { conferenceVenueService } from '@services/conference-venue.service';
import { eventTypeService } from '@services/event-type.service';
import { guestService } from '@services/guest.service';
import { paymentMethodService } from '@services/payment-method.service';
import { SearchGuestDialog, type SelectedGuest } from '@pages/Resort/Shared/SearchGuestDialog';
import { SearchConferenceCompanyDialog, type SelectedConferenceCompany } from '@pages/Resort/Shared/SearchConferenceCompanyDialog';
import { ConferenceBookingAddOnDialog } from './ConferenceBookingAddOnDialog';
import { ConferenceBookingPaymentDialog } from './ConferenceBookingPaymentDialog';
import type {
  ConferenceBookingAddOnDto,
  ConferenceBookingDto,
  ConferenceBookingPaymentDto,
  ConferencePricingType,
  CreateConferenceBookingDto,
  EventTypeDto,
  RecordConferenceBookingPaymentDto,
} from '@/types/conference.types';
import { ConferenceOrganizerType as OrganizerTypeEnum, ConferencePricingType as PricingTypeEnum, ConferenceBookingStatus as StatusEnum } from '@/types/conference.types';
import { formatDate, formatMoney } from '@utils/helpers';

type BookingFormState = CreateConferenceBookingDto;
type StagedConferenceBookingPayment = Omit<RecordConferenceBookingPaymentDto, 'conferenceBookingId'> & {
  id: string;
  paymentMethodName: string;
  isPendingSave: boolean;
};

const createEmptyBooking = (): BookingFormState => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 4);

  return {
    venueId: '',
    guestId: null,
    eventTypeId: null,
    eventName: '',
    eventType: undefined,
    organizerType: OrganizerTypeEnum.Individual,
    organizerName: '',
    conferenceCompanyId: null,
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    startDateTime: toDateTimeLocalValue(start.toISOString()),
    endDateTime: toDateTimeLocalValue(end.toISOString()),
    attendeeCount: 20,
    pricingType: PricingTypeEnum.Hourly,
    customBaseAmount: null,
    depositRequired: 0,
    setupBufferMinutes: 60,
    teardownBufferMinutes: 30,
    status: StatusEnum.Inquiry,
    notes: '',
    specialRequests: '',
    addOns: [],
  };
};

export function ConferenceBookingPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BookingFormState>(createEmptyBooking());
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [addOnDialogOpen, setAddOnDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [stagedPayments, setStagedPayments] = useState<StagedConferenceBookingPayment[]>([]);

  const bookingQuery = useQuery({
    queryKey: ['conference-booking', id],
    queryFn: () => conferenceBookingService.getConferenceBooking(id ?? ''),
    enabled: isEdit,
  });

  const venuesQuery = useQuery({
    queryKey: ['conference-venues-active'],
    queryFn: conferenceVenueService.getActiveConferenceVenues,
  });

  const extrasQuery = useQuery({
    queryKey: ['conference-extras-active'],
    queryFn: conferenceExtraService.getActiveConferenceExtras,
  });

  const eventTypesQuery = useQuery({
    queryKey: ['event-types-active'],
    queryFn: eventTypeService.getActiveEventTypes,
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: paymentMethodService.getPaymentMethods,
  });

  const selectedGuestQuery = useQuery({
    queryKey: ['conference-booking-guest', form.guestId],
    queryFn: () => guestService.getGuest(form.guestId ?? ''),
    enabled: Boolean(form.guestId),
  });

  const selectedCompanyQuery = useQuery({
    queryKey: ['conference-company', form.conferenceCompanyId],
    queryFn: () => conferenceCompanyService.getConferenceCompany(form.conferenceCompanyId ?? ''),
    enabled: Boolean(form.conferenceCompanyId),
  });

  useEffect(() => {
    if (!bookingQuery.data) return;

    const booking = bookingQuery.data;
    setForm({
      venueId: booking.venueId,
      guestId: booking.guestId ?? null,
      eventTypeId: booking.eventTypeId ?? null,
      eventName: booking.eventName,
      eventType: booking.eventType || undefined,
      organizerType: booking.organizerType,
      organizerName: booking.organizerName,
      conferenceCompanyId: booking.conferenceCompanyId ?? null,
      companyName: booking.companyName,
      contactPerson: booking.contactPerson,
      phone: booking.phone,
      email: booking.email,
      startDateTime: toDateTimeLocalValue(booking.startDateTime),
      endDateTime: toDateTimeLocalValue(booking.endDateTime),
      attendeeCount: booking.attendeeCount,
      pricingType: booking.pricingType,
      customBaseAmount: booking.pricingType === PricingTypeEnum.Custom ? booking.baseAmount : null,
      depositRequired: booking.depositRequired,
      setupBufferMinutes: booking.setupBufferMinutes,
      teardownBufferMinutes: booking.teardownBufferMinutes,
      status: booking.status,
      notes: booking.notes,
      specialRequests: booking.specialRequests,
      addOns: booking.addOns.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        quantity: addOn.quantity,
        unitPrice: addOn.unitPrice,
      })),
    });
    setStagedPayments([]);
  }, [bookingQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (input: BookingFormState) => {
      const pendingPayments = [...stagedPayments];
      let savedId: string;

      if (isEdit && id) {
        await conferenceBookingService.updateConferenceBooking({ id, ...serializeBooking(input) });
        savedId = id;
      } else {
        savedId = await conferenceBookingService.createConferenceBooking(serializeBooking(input));
      }

      for (const payment of pendingPayments) {
        await conferenceBookingService.recordConferenceBookingPayment({
          conferenceBookingId: savedId,
          paymentMethodId: payment.paymentMethodId,
          amount: payment.amount,
          paidDate: payment.paidDate,
          referenceNo: payment.referenceNo,
        });
      }

      return savedId;
    },
    onSuccess: async (savedId) => {
      const queuedPaymentCount = stagedPayments.length;
      setPaymentDialogOpen(false);
      setStagedPayments([]);
      void queryClient.invalidateQueries({ queryKey: ['conference-bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-booking'] });

      await Swal.fire({
        icon: 'success',
        title: isEdit ? 'Booking updated' : 'Booking saved',
        text: queuedPaymentCount > 0
          ? `${queuedPaymentCount} payment${queuedPaymentCount === 1 ? '' : 's'} recorded successfully.`
          : 'Event booking saved successfully.',
        confirmButtonText: 'OK',
      });

      void navigate(`/front-desk/conference-bookings/${savedId}`);
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async (action: 'tentative' | 'confirm' | 'start' | 'complete' | 'cancel') => {
      if (!id) return;

      if (action === 'cancel') {
        const result = await Swal.fire({
          title: 'Cancel booking?',
          text: 'This will release the venue schedule for this event.',
          icon: 'warning',
          input: 'text',
          inputPlaceholder: 'Reason (optional)',
          showCancelButton: true,
          confirmButtonText: 'Cancel booking',
        });

        if (!result.isConfirmed) return;
        await conferenceBookingService.cancelConferenceBooking(id, result.value || '');
        return;
      }

      if (action === 'confirm') {
        const result = await Swal.fire({
          title: 'Confirm booking?',
          text: 'This will mark the event booking as confirmed and reserve the venue schedule.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Confirm booking',
        });

        if (!result.isConfirmed) return;
      }

      if (action === 'complete') {
        const result = await Swal.fire({
          title: 'Complete event?',
          text: 'This will close the event booking and mark it as completed.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Complete event',
        });

        if (!result.isConfirmed) return;
      }

      if (action === 'tentative') await conferenceBookingService.markConferenceBookingTentative(id);
      if (action === 'confirm') await conferenceBookingService.confirmConferenceBooking(id);
      if (action === 'start') await conferenceBookingService.startConferenceBooking(id);
      if (action === 'complete') await conferenceBookingService.completeConferenceBooking(id);
    },
    onSuccess: () => {
      if (!id) return;
      void queryClient.invalidateQueries({ queryKey: ['conference-booking', id] });
      void queryClient.invalidateQueries({ queryKey: ['conference-bookings'] });
    },
  });

  const computedAddOnTotal = useMemo(() => form.addOns.reduce((sum, addOn) => sum + (Number(addOn.quantity) || 0) * (Number(addOn.unitPrice) || 0), 0), [form.addOns]);
  const availabilityInput = useMemo(() => {
    if (!form.venueId || !form.startDateTime || !form.endDateTime) return null;

    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

    return {
      venueId: form.venueId,
      startDateTime: serializeDateTime(form.startDateTime),
      endDateTime: serializeDateTime(form.endDateTime),
      bookingId: id,
      setupBufferMinutes: form.setupBufferMinutes,
      teardownBufferMinutes: form.teardownBufferMinutes,
    };
  }, [form.endDateTime, form.setupBufferMinutes, form.startDateTime, form.teardownBufferMinutes, form.venueId, id]);

  const availabilityQuery = useQuery({
    queryKey: [
      'conference-booking-availability',
      availabilityInput?.venueId,
      availabilityInput?.startDateTime,
      availabilityInput?.endDateTime,
      availabilityInput?.bookingId,
      availabilityInput?.setupBufferMinutes,
      availabilityInput?.teardownBufferMinutes,
    ],
    queryFn: () => conferenceBookingService.checkConferenceBookingAvailability(availabilityInput!),
    enabled: Boolean(availabilityInput),
    retry: false,
  });

  const currentBooking = bookingQuery.data;
  const isTerminalBooking = currentBooking?.status === StatusEnum.Cancelled || currentBooking?.status === StatusEnum.Completed;
  const paymentMethodLookup = useMemo(
    () => new Map((paymentMethodsQuery.data ?? []).map((method) => [method.id, method.name])),
    [paymentMethodsQuery.data],
  );
  const displayedPayments = useMemo<ConferenceBookingPaymentDto[]>(() => {
    const savedPayments = currentBooking?.payments ?? [];
    const pendingPayments = stagedPayments.map((payment) => ({
      id: payment.id,
      paymentMethodId: payment.paymentMethodId,
      paymentMethodName: payment.paymentMethodName,
      amount: payment.amount,
      paidDate: payment.paidDate,
      referenceNo: payment.referenceNo ?? '',
    }));

    return [...savedPayments, ...pendingPayments];
  }, [currentBooking?.payments, stagedPayments]);
  const selectedVenue = useMemo(
    () => (venuesQuery.data ?? []).find((venue) => venue.id === form.venueId) ?? null,
    [form.venueId, venuesQuery.data],
  );
  const selectedCompany = useMemo<SelectedConferenceCompany | null>(() => {
    if (selectedCompanyQuery.data) {
      return {
        id: selectedCompanyQuery.data.id,
        name: selectedCompanyQuery.data.name,
        contactPerson: selectedCompanyQuery.data.contactPerson || undefined,
        phone: selectedCompanyQuery.data.phone || undefined,
        email: selectedCompanyQuery.data.email || undefined,
      };
    }

    if (!form.conferenceCompanyId && !(form.companyName ?? '').trim()) {
      return null;
    }

    return {
      id: form.conferenceCompanyId ?? '',
      name: (form.companyName ?? '').trim() || 'Selected company',
      contactPerson: (form.contactPerson ?? '').trim() || undefined,
      phone: (form.phone ?? '').trim() || undefined,
      email: (form.email ?? '').trim() || undefined,
    };
  }, [form.companyName, form.conferenceCompanyId, form.contactPerson, form.email, form.phone, selectedCompanyQuery.data]);
  const selectedGuest = useMemo<SelectedGuest | null>(() => {
    if (!form.guestId) return null;

    if (selectedGuestQuery.data) {
      return {
        id: selectedGuestQuery.data.id,
        guestCode: selectedGuestQuery.data.guestCode,
        fullName: `${selectedGuestQuery.data.firstName} ${selectedGuestQuery.data.lastName}`.trim(),
        phone: selectedGuestQuery.data.phone || undefined,
        email: selectedGuestQuery.data.email || undefined,
      };
    }

    return {
      id: form.guestId,
      guestCode: '',
      fullName: form.contactPerson || form.organizerName,
      phone: form.phone || undefined,
      email: form.email || undefined,
    };
  }, [form.email, form.guestId, form.organizerName, form.phone, selectedGuestQuery.data]);
  const pricingPreview = useMemo(() => {
    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    const hasValidRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
    const durationHours = hasValidRange ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
    const billedHours = Math.max(0, Math.ceil(durationHours));

    const baseAmount = (() => {
      if (form.pricingType === PricingTypeEnum.Custom) {
        return Math.max(0, Number(form.customBaseAmount) || 0);
      }

      if (!selectedVenue) {
        return 0;
      }

      if (form.pricingType === PricingTypeEnum.Hourly) {
        return Number((billedHours * selectedVenue.hourlyRate).toFixed(2));
      }

      if (form.pricingType === PricingTypeEnum.HalfDay) {
        return selectedVenue.halfDayRate;
      }

      if (form.pricingType === PricingTypeEnum.FullDay) {
        return selectedVenue.fullDayRate;
      }

      return selectedVenue.hourlyRate;
    })();

    const basisLabel = (() => {
      if (form.pricingType === PricingTypeEnum.Custom) {
        return 'Custom base amount';
      }

      if (!selectedVenue) {
        return 'Select a venue to preview base rate';
      }

      if (!hasValidRange && form.pricingType === PricingTypeEnum.Hourly) {
        return 'Enter a valid time range for hourly pricing';
      }

      if (form.pricingType === PricingTypeEnum.Hourly) {
        return `${billedHours} billed hour${billedHours === 1 ? '' : 's'} x ${formatMoney(selectedVenue.hourlyRate)}`;
      }

      if (form.pricingType === PricingTypeEnum.HalfDay) {
        return `Half-day package rate for ${selectedVenue.name}`;
      }

      if (form.pricingType === PricingTypeEnum.FullDay) {
        return `Full-day package rate for ${selectedVenue.name}`;
      }

      return 'Venue rate';
    })();

    return {
      durationHours,
      billedHours,
      baseAmount,
      basisLabel,
      projectedTotal: baseAmount + computedAddOnTotal,
    };
  }, [computedAddOnTotal, form.customBaseAmount, form.endDateTime, form.pricingType, form.startDateTime, selectedVenue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? currentBooking?.bookingNo ?? 'Event Booking' : 'New Event Booking'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create flexible time-based bookings for weddings, meetings, and company events.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/front-desk/conference-bookings" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Back to List
          </Link>
          {isEdit ? <StatusActionButtons booking={currentBooking} isPending={transitionMutation.isPending} onAction={(action) => transitionMutation.mutate(action)} /> : null}
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,420px)]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Event Name" value={form.eventName} onChange={(value) => setForm((current) => ({ ...current, eventName: value }))} />
              <SelectField
                label="Event Type"
                value={form.eventTypeId ?? ''}
                onChange={(value) => {
                  const selectedEventType = (eventTypesQuery.data ?? []).find((item) => item.id === value) ?? null;
                  setForm((current) => ({
                    ...current,
                    eventTypeId: value || null,
                    eventType: selectedEventType?.name,
                  }));
                }}
                options={(eventTypesQuery.data ?? []).map((eventType: EventTypeDto) => ({ value: eventType.id, label: eventType.name }))}
                placeholder="Select event type"
              />
              <div className="block text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                <span className="mb-1 block">Organizer Type</span>
                {isTerminalBooking ? (
                  <div className="rounded border border-gray-300 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                    {form.organizerType === OrganizerTypeEnum.Company ? 'Company' : 'Individual'}
                  </div>
                ) : (
                  <div className="flex w-full overflow-hidden rounded border border-gray-300 dark:border-gray-600">
                    {[
                      { value: OrganizerTypeEnum.Individual, label: 'Individual' },
                      { value: OrganizerTypeEnum.Company, label: 'Company' },
                    ].map((option) => {
                      const isActive = form.organizerType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => setForm((current) => ({
                            ...current,
                            organizerType: option.value,
                            guestId: option.value === OrganizerTypeEnum.Company ? null : current.guestId,
                            conferenceCompanyId: option.value === OrganizerTypeEnum.Company ? current.conferenceCompanyId : null,
                            companyName: option.value === OrganizerTypeEnum.Company ? current.companyName : '',
                          }))}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {form.organizerType === OrganizerTypeEnum.Individual ? (
                <div className="md:col-span-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Guest Organizer</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Select an existing guest to populate organizer details.</p>
                    </div>
                    {!isTerminalBooking ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
                          onClick={() => setGuestDialogOpen(true)}
                        >
                          Search Guest
                        </button>
                        {form.guestId ? (
                          <button
                            type="button"
                            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() => {
                              setForm((current) => ({ ...current, guestId: null }));
                            }}
                          >
                            Clear Guest
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {selectedGuest ? (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/20">
                      <div className="font-medium text-gray-900 dark:text-white">{selectedGuest.fullName}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {selectedGuest.guestCode ? `${selectedGuest.guestCode} • ` : ''}
                        {selectedGuest.phone || 'No phone'}
                        {' • '}
                        {selectedGuest.email || 'No email'}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {form.organizerType === OrganizerTypeEnum.Company ? (
                <div className="md:col-span-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Company Organizer</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Search an existing company or add a new company profile for this booking.</p>
                    </div>
                    {!isTerminalBooking ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
                          onClick={() => setCompanyDialogOpen(true)}
                        >
                          Search Company
                        </button>
                        {form.conferenceCompanyId || (form.companyName ?? '').trim() ? (
                          <button
                            type="button"
                            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                conferenceCompanyId: null,
                                companyName: '',
                              }));
                            }}
                          >
                            Clear Company
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {selectedCompany ? (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/20">
                      <div className="font-medium text-gray-900 dark:text-white">{selectedCompany.name}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {selectedCompany.contactPerson || 'No contact'}
                        {' • '}
                        {selectedCompany.phone || 'No phone'}
                        {' • '}
                        {selectedCompany.email || 'No email'}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                      No company selected.
                    </div>
                  )}
                </div>
              ) : null}
              {form.organizerType === OrganizerTypeEnum.Company ? (
                <div className="md:col-span-2">
                  <TextField label="Contact Person" value={form.contactPerson ?? ''} onChange={(value) => setForm((current) => ({ ...current, contactPerson: value }))} />
                </div>
              ) : null}
              <TextField label="Phone" value={form.phone ?? ''} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
              <TextField label="Email" value={form.email ?? ''} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
              <SelectField
                label="Venue"
                value={form.venueId}
                onChange={(value) => setForm((current) => ({ ...current, venueId: value }))}
                options={(venuesQuery.data ?? []).map((venue) => ({ value: venue.id, label: `${venue.name} (${venue.code})` }))}
                placeholder="Select venue"
              />
              <NumberField label="Attendee Count" value={form.attendeeCount} onChange={(value) => setForm((current) => ({ ...current, attendeeCount: value }))} min={1} step="1" />
              <DateTimeField label="Start" value={form.startDateTime} onChange={(value) => setForm((current) => ({ ...current, startDateTime: value }))} />
              <DateTimeField label="End" value={form.endDateTime} onChange={(value) => setForm((current) => ({ ...current, endDateTime: value }))} />
              <NumberField label="Setup Buffer (mins)" value={form.setupBufferMinutes ?? 0} onChange={(value) => setForm((current) => ({ ...current, setupBufferMinutes: value }))} min={0} step="1" />
              <NumberField label="Teardown Buffer (mins)" value={form.teardownBufferMinutes ?? 0} onChange={(value) => setForm((current) => ({ ...current, teardownBufferMinutes: value }))} min={0} step="1" />
              {form.venueId || form.startDateTime || form.endDateTime ? (
                <div className="md:col-span-2">
                  {!availabilityInput ? (
                    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                      Select a venue and a valid start/end time to check availability.
                    </div>
                  ) : availabilityQuery.isLoading ? (
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-300">
                      Checking venue availability...
                    </div>
                  ) : availabilityQuery.data ? (
                    <div className={`rounded border px-3 py-2 text-sm ${availabilityQuery.data.isAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300'}`}>
                      {availabilityQuery.data.message}
                    </div>
                  ) : availabilityQuery.isError ? (
                    <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                      Unable to check availability right now.
                    </div>
                  ) : null}
                </div>
              ) : null}
              <SelectField
                label="Pricing Type"
                value={String(form.pricingType)}
                onChange={(value) => setForm((current) => ({ ...current, pricingType: Number(value) as ConferencePricingType }))}
                options={[
                  { value: String(PricingTypeEnum.Hourly), label: 'Hourly' },
                  { value: String(PricingTypeEnum.HalfDay), label: 'Half-Day Package' },
                  { value: String(PricingTypeEnum.FullDay), label: 'Full-Day Package' },
                  { value: String(PricingTypeEnum.Custom), label: 'Custom Quote' },
                ]}
              />
              {form.pricingType === PricingTypeEnum.Custom ? (
                <NumberField label="Custom Base Amount" value={form.customBaseAmount ?? 0} onChange={(value) => setForm((current) => ({ ...current, customBaseAmount: value }))} min={0} step="0.01" />
              ) : null}
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Initial Status
                <div className="mt-1 rounded border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {isEdit ? StatusEnum[form.status] : StatusEnum[StatusEnum.Inquiry]}
                </div>
              </label>
            </div>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Notes
              <textarea className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={3} value={form.notes ?? ''} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Special Requests
              <textarea className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={3} value={form.specialRequests ?? ''} onChange={(event) => setForm((current) => ({ ...current, specialRequests: event.target.value }))} />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Commercial Summary</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <SummaryRow label="Pricing Mode" value={PricingTypeEnum[form.pricingType]} />
                <SummaryRow label="Base Rate" value={formatMoney(pricingPreview.baseAmount)} />
                <SummaryRow label="Rate Basis" value={pricingPreview.basisLabel} />
                {form.pricingType === PricingTypeEnum.Hourly ? <SummaryRow label="Event Duration" value={`${pricingPreview.durationHours.toFixed(2)} hrs (${pricingPreview.billedHours} billable)`} /> : null}
                <SummaryRow label="Add-On Total" value={formatMoney(computedAddOnTotal)} />
                <SummaryRow label="Projected Total" value={formatMoney(pricingPreview.projectedTotal)} />
                {currentBooking ? <SummaryRow label="Current Total" value={formatMoney(currentBooking.totalAmount)} /> : null}
              </dl>
            </div>

            <AddOnSection
              addOns={form.addOns}
              isReadOnly={isTerminalBooking}
              onAdd={() => setAddOnDialogOpen(true)}
              onRemove={(index) => setForm((current) => ({
                ...current,
                addOns: current.addOns.filter((_, itemIndex) => itemIndex !== index),
              }))}
            />

            <PaymentsSection
              payments={displayedPayments}
              isReadOnly={isTerminalBooking}
              isSaving={saveMutation.isPending}
              onAddPayment={() => setPaymentDialogOpen(true)}
              onRemovePendingPayment={(paymentId) => {
                setStagedPayments((current) => current.filter((payment) => payment.id !== paymentId));
              }}
            />
          </div>
        </div>

        {!isTerminalBooking ? (
          <div className="xl:col-span-2 border-t border-gray-200 pt-5 dark:border-gray-700">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.venueId || !form.eventName.trim() || (form.organizerType === OrganizerTypeEnum.Company ? !(form.companyName ?? '').trim() || !(form.contactPerson ?? '').trim() : !form.guestId && !form.organizerName.trim())}
              >
                {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Booking'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <SearchGuestDialog
        open={guestDialogOpen}
        onClose={() => setGuestDialogOpen(false)}
        onSelectGuest={(guest) => {
          setForm((current) => ({
            ...current,
            guestId: guest.id,
            conferenceCompanyId: null,
            companyName: '',
            organizerName: guest.fullName,
            contactPerson: guest.fullName,
            phone: guest.phone ?? current.phone,
            email: guest.email ?? current.email,
            organizerType: OrganizerTypeEnum.Individual,
          }));
          setGuestDialogOpen(false);
        }}
      />

      <SearchConferenceCompanyDialog
        open={companyDialogOpen}
        onClose={() => setCompanyDialogOpen(false)}
        onSelectCompany={(company) => {
          setForm((current) => ({
            ...current,
            guestId: null,
            conferenceCompanyId: company.id,
            companyName: company.name,
            organizerName: company.contactPerson ?? company.name,
            contactPerson: company.contactPerson ?? current.contactPerson,
            phone: company.phone ?? current.phone,
            email: company.email ?? current.email,
            organizerType: OrganizerTypeEnum.Company,
          }));
          setCompanyDialogOpen(false);
        }}
      />

      <ConferenceBookingAddOnDialog
        open={addOnDialogOpen}
        extraCatalog={extrasQuery.data ?? []}
        onClose={() => setAddOnDialogOpen(false)}
        onSave={(addOn) => {
          setForm((current) => ({
            ...current,
            addOns: [...current.addOns, addOn],
          }));
          setAddOnDialogOpen(false);
        }}
      />

      <ConferenceBookingPaymentDialog
        open={paymentDialogOpen}
        paymentMethods={paymentMethodsQuery.data ?? []}
        isSaving={saveMutation.isPending}
        onClose={() => setPaymentDialogOpen(false)}
        onSave={(payment) => {
          setStagedPayments((current) => [...current, {
            id: createTempPaymentId(),
            paymentMethodId: payment.paymentMethodId,
            paymentMethodName: paymentMethodLookup.get(payment.paymentMethodId) ?? 'Unknown Method',
            amount: payment.amount,
            paidDate: serializeDateTime(payment.paidDate),
            referenceNo: payment.referenceNo,
            isPendingSave: true,
          }]);
          setPaymentDialogOpen(false);
        }}
      />
    </div>
  );
}

function AddOnSection({
  addOns,
  isReadOnly,
  onAdd,
  onRemove,
}: {
  addOns: ConferenceBookingAddOnDto[];
  isReadOnly: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add-On Services</h2>
        </div>
        {!isReadOnly ? <button type="button" className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700" onClick={onAdd}>Add</button> : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left dark:border-gray-700">
              <th className="p-2">Service</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Line Total</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {addOns.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">No add-on services added yet.</td>
              </tr>
            ) : (
              addOns.map((addOn, index) => (
                <tr key={`${addOn.id ?? 'new'}-${index}`} className="border-b dark:border-gray-700">
                  <td className="p-2">{addOn.name}</td>
                  <td className="p-2 text-right">{addOn.quantity}</td>
                  <td className="p-2 text-right">{formatMoney(addOn.unitPrice)}</td>
                  <td className="p-2 text-right">{formatMoney((Number(addOn.quantity) || 0) * (Number(addOn.unitPrice) || 0))}</td>
                  <td className="p-2 text-right">{!isReadOnly ? <button type="button" className="rounded bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700" onClick={() => onRemove(index)}>x</button> : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsSection({
  payments,
  isReadOnly,
  isSaving,
  onAddPayment,
  onRemovePendingPayment,
}: {
  payments: ConferenceBookingPaymentDto[];
  isReadOnly: boolean;
  isSaving: boolean;
  onAddPayment: () => void;
  onRemovePendingPayment: (paymentId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h2>
        </div>
        {!isReadOnly ? <button type="button" className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50" onClick={onAddPayment} disabled={isSaving}>Add</button> : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left dark:border-gray-700">
              <th className="p-2">Date</th>
              <th className="p-2">Method</th>
              <th className="p-2">Reference</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">No payments added yet.</td>
              </tr>
            ) : (
              payments.map((payment) => {
                const isPendingPayment = isTempPaymentId(payment.id);

                return (
                  <tr key={payment.id} className="border-b dark:border-gray-700">
                    <td className="p-2">{formatDate(payment.paidDate)}</td>
                    <td className="p-2">{payment.paymentMethodName}</td>
                    <td className="p-2">{payment.referenceNo || '—'}</td>
                    <td className="p-2 text-right">{formatMoney(payment.amount)}</td>
                    <td className="p-2 text-right">
                      {isPendingPayment && !isReadOnly ? (
                        <button type="button" className="rounded bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700" onClick={() => onRemovePendingPayment(payment.id)} disabled={isSaving}>
                          x
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusActionButtons({
  booking,
  isPending,
  onAction,
}: {
  booking?: ConferenceBookingDto;
  isPending: boolean;
  onAction: (action: 'tentative' | 'confirm' | 'start' | 'complete' | 'cancel') => void;
}) {
  if (!booking || booking.status === StatusEnum.Cancelled || booking.status === StatusEnum.Completed) return null;

  return (
    <>
      {booking.status === StatusEnum.Inquiry ? <button type="button" className="rounded border border-amber-300 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/20" onClick={() => onAction('tentative')} disabled={isPending}>Mark Tentative</button> : null}
      {(booking.status === StatusEnum.Inquiry || booking.status === StatusEnum.Tentative) ? <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700" onClick={() => onAction('confirm')} disabled={isPending}>Confirm</button> : null}
      {booking.status === StatusEnum.Confirmed ? <button type="button" className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700" onClick={() => onAction('start')} disabled={isPending}>Start Event</button> : null}
      {(booking.status === StatusEnum.Confirmed || booking.status === StatusEnum.InProgress) ? <button type="button" className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800" onClick={() => onAction('complete')} disabled={isPending}>Complete</button> : null}
      <button type="button" className="rounded bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700" onClick={() => onAction('cancel')} disabled={isPending}>Cancel</button>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      {label}
      <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange, min, step }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: string }) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      {label}
      <input type="number" min={min} step={step} className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      {label}
      <select className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder ?? 'Select'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      {label}
      <input type="datetime-local" className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function serializeBooking(form: BookingFormState): CreateConferenceBookingDto {
  const organizerName = (form.contactPerson ?? '').trim() || (form.organizerType === OrganizerTypeEnum.Company ? (form.companyName ?? '').trim() : '') || form.organizerName.trim();

  return {
    ...form,
    depositRequired: 0,
    organizerName,
    eventType: undefined,
    startDateTime: serializeDateTime(form.startDateTime),
    endDateTime: serializeDateTime(form.endDateTime),
    addOns: form.addOns.map((addOn) => ({
      name: addOn.name.trim(),
      quantity: Number(addOn.quantity) || 1,
      unitPrice: Number(addOn.unitPrice) || 0,
    })),
  };
}

function serializeDateTime(value: string) {
  return new Date(value).toISOString();
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function createTempPaymentId() {
  return `pending-${Math.random().toString(36).slice(2, 10)}`;
}

function isTempPaymentId(value: string) {
  return value.startsWith('pending-');
}