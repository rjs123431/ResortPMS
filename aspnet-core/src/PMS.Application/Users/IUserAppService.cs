using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using PMS.Roles.Dto;
using PMS.Users.Dto;

namespace PMS.Users;

public interface IUserAppService : IAsyncCrudAppService<UserDto, long, PagedUserResultRequestDto, CreateUserDto, UserDto>
{
    Task<ListResultDto<RoleDto>> GetRoles();
    Task ChangeLanguage(ChangeUserLanguageDto input);
    Task<bool> ChangePassword(ChangePasswordDto input);
    Task<UserDto> GetRecordAsync(EntityDto<long> input);
    Task<ListResultDto<UserDto>> GetUserListAsync();
}





