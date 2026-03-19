using AutoMapper;
using PMS.Authorization.Users;
using PMS.Authorization.Users.Importing.Dto;
using PMS.App.Rooms;
using PMS.App.Rooms.Dto;
using PMS.App;

namespace PMS
{
    internal static class CustomDtoMapper
    {
        public static void CreateMappings(IMapperConfigurationExpression configuration)
        {
            configuration.CreateMap<ImportUserDto, User>();

            // App - Room Type mapping
            configuration.CreateMap<RoomType, RoomTypeListDto>()
                .ForMember(dest => dest.NumberOfRooms, opt => opt.MapFrom(src => src.Rooms.Count));
        }
    }
}


