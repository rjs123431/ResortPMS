using System.ComponentModel.DataAnnotations;

namespace PMS.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}




