using PMS.Authorization.Users.Importing.Dto;
using PMS.Dto;
using System.Collections.Generic;

namespace PMS.Authorization.Users.Importing
{
    public interface IInvalidUserExporter
    {
        FileDto ExportToFile(List<ImportUserDto> userListDtos);
    }
}





