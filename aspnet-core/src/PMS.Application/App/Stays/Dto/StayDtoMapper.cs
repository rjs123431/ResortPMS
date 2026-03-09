using AutoMapper;
using PMS.App.Stays.Dto;

namespace PMS.App.Stays;

public class StayDtoMapper : Profile
{
    public StayDtoMapper()
    {
        CreateMap<Stay, StayDto>()
            .ForMember(dto => dto.RoomTypeName, opt => opt.MapFrom(
                src => src.AssignedRoom != null && src.AssignedRoom.RoomType != null
                    ? src.AssignedRoom.RoomType.Name
                    : string.Empty));

        CreateMap<Stay, StayListDto>();

        CreateMap<StayGuest, StayGuestDto>()
            .ForMember(dto => dto.GuestName, opt => opt.MapFrom(
                src => src.Guest != null
                    ? $"{src.Guest.FirstName} {src.Guest.LastName}".Trim()
                    : string.Empty));

        CreateMap<Folio, FolioDto>();

        CreateMap<FolioTransaction, FolioTransactionDto>()
            .ForMember(dto => dto.ChargeTypeName, opt => opt.MapFrom(
                src => src.ChargeType != null ? src.ChargeType.Name : string.Empty));

        CreateMap<FolioPayment, FolioPaymentDto>()
            .ForMember(dto => dto.PaymentMethodName, opt => opt.MapFrom(
                src => src.PaymentMethod != null ? src.PaymentMethod.Name : string.Empty));
    }
}
