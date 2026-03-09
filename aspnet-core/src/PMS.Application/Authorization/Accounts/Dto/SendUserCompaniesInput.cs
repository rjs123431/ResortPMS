using Abp.Authorization.Users;
using System.ComponentModel.DataAnnotations;

namespace PMS.Authorization.Accounts.Dto
{
    public class SendUserCompaniesInput
    {
        [Required]
        [MaxLength(AbpUserBase.MaxEmailAddressLength)]
        public string EmailAddress { get; set; }
    }
}





