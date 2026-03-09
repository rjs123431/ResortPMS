using AutoMapper;
using PMS.Authorization.Users;
using PMS.Authorization.Users.Importing.Dto;

namespace PMS
{
    internal static class CustomDtoMapper
    {
        public static void CreateMappings(IMapperConfigurationExpression configuration)
        {
            configuration.CreateMap<ImportUserDto, User>();

            // App

        }
    }
}


