using Abp;
using Abp.Dependency;
using Abp.Domain.Uow;
using Abp.Runtime.Caching;
using Abp.Threading;
using Microsoft.IdentityModel.Tokens;
using PMS.Authorization.Users;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;

namespace PMS.Authentication.JwtBearer
{
    public class PMSJwtSecurityTokenHandler : JwtSecurityTokenHandler
    {
        public override ClaimsPrincipal ValidateToken(string token, TokenValidationParameters validationParameters, out SecurityToken validatedToken)
        {
            var cacheManager = IocManager.Instance.Resolve<ICacheManager>();

            // Call base method to validate the token
            var principal = base.ValidateToken(token, validationParameters, out validatedToken);

            var userIdentifierString = principal.Claims.FirstOrDefault(c => c.Type == AppConsts.UserIdentifier);
            var tokenValidityKeyInClaims = principal.Claims.FirstOrDefault(c => c.Type == AppConsts.TokenValidityKey);

            if (userIdentifierString == null || tokenValidityKeyInClaims == null)
            {
                throw new SecurityTokenException("Invalid token claims.");
            }

            var tokenValidityKeyInCache = cacheManager
                .GetCache(AppConsts.TokenValidityKey)
                .GetOrDefault(tokenValidityKeyInClaims.Value);

            if (tokenValidityKeyInCache != null)
            {
                return principal;
            }

            using (var unitOfWorkManager = IocManager.Instance.ResolveAsDisposable<IUnitOfWorkManager>())
            {
                using (var uow = unitOfWorkManager.Object.Begin())
                {
                    var userIdentifier = UserIdentifier.Parse(userIdentifierString.Value);

                    using (unitOfWorkManager.Object.Current.SetTenantId(userIdentifier.TenantId))
                    {
                        using (var userManager = IocManager.Instance.ResolveAsDisposable<UserManager>())
                        {
                            var userManagerObject = userManager.Object;
                            var user = userManagerObject.GetUser(userIdentifier);
                            var isValidityKeyValid = AsyncHelper.RunSync(() => userManagerObject.IsTokenValidityKeyValidAsync(user, tokenValidityKeyInClaims.Value));
                            uow.Complete();

                            if (isValidityKeyValid)
                            {
                                cacheManager
                                    .GetCache(AppConsts.TokenValidityKey)
                                    .Set(tokenValidityKeyInClaims.Value, "");

                                return principal;
                            }
                        }
                    }

                    throw new SecurityTokenException("Invalid token validity key.");
                }
            }
        }
    }
}