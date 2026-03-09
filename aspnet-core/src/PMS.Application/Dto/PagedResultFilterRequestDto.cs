using Abp.Application.Services.Dto;

namespace PMS.Dto
{
    public class PagedResultFilterRequestDto : PagedAndSortedResultRequestDto
    {
        public string Filter { get; set; }
    }
}





