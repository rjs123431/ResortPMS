using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.Runtime.Session;
using Abp.Zero.Configuration;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PMS.Authorization
{
    public interface IUserPermissionChecker
    {
        Task<List<User>> GetAllUsersWithPermission(List<string> permissions);
    }

    public class UserPermissionChecker : PMSServiceBase, IUserPermissionChecker, ITransientDependency
    {
        private readonly IAbpSession _abpSession;
        private readonly UserManager _userManager;
        private readonly IRoleManagementConfig _roleManagementConfig;
        private readonly IRepository<Role> _roleRepository;
        private readonly IRepository<UserRole, long> _userRoleRepository;
        private readonly IRepository<RolePermissionSetting, long> _rolePermissionRepository;
        private readonly IRepository<UserPermissionSetting, long> _userPermissionRepository;

        public UserPermissionChecker(
            IAbpSession abpSession,
            UserManager userManager,
            IRoleManagementConfig roleManagementConfig,
            IRepository<Role> roleRepository,
            IRepository<UserRole, long> userRoleRepository,
            IRepository<RolePermissionSetting, long> rolePermissionRepository,
            IRepository<UserPermissionSetting, long> userPermissionRepository
            )
        {
            _abpSession = abpSession;
            _userManager = userManager;
            _roleManagementConfig = roleManagementConfig;
            _roleRepository = roleRepository;
            _userRoleRepository = userRoleRepository;
            _rolePermissionRepository = rolePermissionRepository;
            _userPermissionRepository = userPermissionRepository;
        }

        public async Task<List<User>> GetAllUsersWithPermission(List<string> permissions)
        {
            var query = GetUsersFilteredQuery(new UserFilterInput { Permissions = permissions });

            var result = await query.ToListAsync();

            return result;
        }

        private IQueryable<User> GetUsersFilteredQuery(UserFilterInput input)
        {
            var query = _userManager.Users
                .Where(u => u.IsActive);

            if (input.Permissions != null && input.Permissions.Any(p => !p.IsNullOrWhiteSpace()))
            {
                var staticRoleNames = _roleManagementConfig.StaticRoles.Where(
                    r => r.GrantAllPermissionsByDefault &&
                         r.Side == _abpSession.MultiTenancySide
                ).Select(r => r.RoleName).ToList();

                var userIds = from user in query
                              join ur in _userRoleRepository.GetAll() on user.Id equals ur.UserId into urJoined
                              from ur in urJoined.DefaultIfEmpty()
                              join urr in _roleRepository.GetAll() on ur.RoleId equals urr.Id into urrJoined
                              from urr in urrJoined.DefaultIfEmpty()
                              join up in _userPermissionRepository.GetAll()
                                  .Where(userPermission => input.Permissions.Contains(userPermission.Name)) on user.Id equals up.UserId into upJoined
                              from up in upJoined.DefaultIfEmpty()
                              join rp in _rolePermissionRepository.GetAll()
                                  .Where(rolePermission => input.Permissions.Contains(rolePermission.Name)) on
                                  new { RoleId = ur == null ? 0 : ur.RoleId } equals new { rp.RoleId } into rpJoined
                              from rp in rpJoined.DefaultIfEmpty()
                              where (up != null && up.IsGranted) ||
                                    (up == null && rp != null && rp.IsGranted) ||
                                    (up == null && rp == null && staticRoleNames.Contains(urr.Name))
                              group user by user.Id
                    into userGrouped
                              select userGrouped.Key;

                query = _userManager.Users.Where(e => userIds.Contains(e.Id));
            }

            return query;
        }
    }
}




