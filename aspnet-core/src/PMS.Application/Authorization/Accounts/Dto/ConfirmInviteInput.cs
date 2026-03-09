using Abp.Auditing;
using Abp.Runtime.Security;
using Abp.Runtime.Validation;
using System;
using System.Web;

namespace PMS.Authorization.Accounts.Dto;

public class ConfirmInviteInput : IShouldNormalize
{
    public long EmployeeId { get; set; }

    public string InviteToken { get; set; }

    [DisableAuditing]
    public string Password { get; set; }

    public string ReturnUrl { get; set; }

    public string SingleSignIn { get; set; }

    /// <summary>
    /// Encrypted values for {TenantId}, {UserId} and {ResetCode}
    /// </summary>
    public string c { get; set; }

    public void Normalize()
    {
        ResolveParameters();
    }

    protected virtual void ResolveParameters()
    {
        if (!string.IsNullOrEmpty(c))
        {
            var parameters = SimpleStringCipher.Instance.Decrypt(c);
            var query = HttpUtility.ParseQueryString(parameters);

            if (query["eid"] != null)
            {
                EmployeeId = Convert.ToInt32(query["eid"]);
            }

            if (query["inviteCode"] != null)
            {
                InviteToken = query["inviteCode"];
            }
        }
    }
}
 
