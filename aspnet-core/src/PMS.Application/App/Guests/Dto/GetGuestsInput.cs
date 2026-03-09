using Abp.Runtime.Validation;
using PMS.Dto;

namespace PMS.App.Guests.Dto;

public class GetGuestsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= nameof(Guest.LastName) + ", " + nameof(Guest.FirstName);
    }
}
