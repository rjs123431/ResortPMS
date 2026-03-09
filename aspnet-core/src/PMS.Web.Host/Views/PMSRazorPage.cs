using Abp.AspNetCore.Mvc.Views;

namespace PMS.Web.Views
{
    public abstract class PMSRazorPage<TModel> : AbpRazorPage<TModel>
    {
        protected PMSRazorPage()
        {
            LocalizationSourceName = PMSConsts.LocalizationSourceName;
        }
    }
}






