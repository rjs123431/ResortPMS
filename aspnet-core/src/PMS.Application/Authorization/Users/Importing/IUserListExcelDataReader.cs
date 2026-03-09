using Abp.Dependency;
using PMS.Authorization.Users.Importing.Dto;
using System.Collections.Generic;

namespace PMS.Authorization.Users.Importing
{
    public interface IUserListExcelDataReader : ITransientDependency
    {
        List<ImportUserDto> GetUsersFromExcel(byte[] fileBytes);
    }
}





