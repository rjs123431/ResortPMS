using System.Linq;

namespace PMS.Extensions;

public static class DecimalExtensions
{
    public static string ToMasked(this decimal salary)
    {
        var formattedValue = salary.ToString("N2");
        var result = new string(formattedValue.Select(c => c is ',' or '.' ? c : '#').ToArray());
        return result;
    }
}

