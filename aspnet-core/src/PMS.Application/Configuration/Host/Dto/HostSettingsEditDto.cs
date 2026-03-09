using PMS.Configuration.Dto;
using System.ComponentModel.DataAnnotations;

namespace PMS.Configuration.Host.Dto
{
    public class HostSettingsEditDto
    {
        [Required]
        public GeneralSettingsEditDto General { get; set; }

        [Required]
        public EmailSettingsEditDto Email { get; set; }
    }
}





