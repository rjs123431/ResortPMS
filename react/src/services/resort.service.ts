// Compatibility barrel — re-exports all domain services as a single object.
// Import directly from the individual service files for new code.
import { agencyService } from './agency.service';
import { channelService } from './channel.service';
import { chargeTypeService } from './charge-type.service';
import { checkInService } from './check-in.service';
import { checkOutService } from './check-out.service';
import { extraBedPricingService } from './extra-bed-pricing.service';
import { extraBedTypeService } from './extra-bed-type.service';
import { guestService } from './guest.service';
import { housekeepingService } from './housekeeping.service';
import { incidentService } from './incident.service';
import { paymentMethodService } from './payment-method.service';
import { preCheckInService } from './pre-check-in.service';
import { quotationService } from './quotation.service';
import { reservationService } from './reservation.service';
import { roomAvailabilityService } from './room-availability.service';
import { roomChangeService } from './room-change.service';
import { roomPricingService } from './room-pricing.service';
import { roomRackService } from './room-rack.service';
import { roomRatePlanService } from './room-rate-plan.service';
import { roomMaintenanceService } from './room-maintenance.service';
import { roomService } from './room.service';
import { roomTypeService } from './room-type.service';
import { staffService } from './staff.service';
import { stayService } from './stay.service';

export const resortService = {
  ...agencyService,
  ...channelService,
  ...chargeTypeService,
  ...checkInService,
  ...checkOutService,
  ...extraBedPricingService,
  ...extraBedTypeService,
  ...guestService,
  ...housekeepingService,
  ...incidentService,
  ...paymentMethodService,
  ...preCheckInService,
  ...quotationService,
  ...reservationService,
  ...roomAvailabilityService,
  ...roomChangeService,
  ...roomPricingService,
  ...roomRackService,
  ...roomRatePlanService,
  ...roomMaintenanceService,
  ...roomService,
  ...roomTypeService,
  ...staffService,
  ...stayService,
};
