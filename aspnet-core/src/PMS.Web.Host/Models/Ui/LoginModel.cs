using Abp.Auditing;
using System.ComponentModel.DataAnnotations;

namespace PMS.Web.Host.Models.Ui
{
    public class LoginModel
    {
        [Required]
        public string UserNameOrEmailAddress { get; set; }

        [Required]
        [DisableAuditing]
        public string Password { get; set; }

        public bool RememberMe { get; set; }

        public string TenancyName { get; set; }
    }
}





