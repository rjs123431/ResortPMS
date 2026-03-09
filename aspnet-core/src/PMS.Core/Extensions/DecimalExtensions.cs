namespace PMS.Extensions
{
    public static class DecimalExtensions
    {
        public static string ToFormattedString(this decimal? val)
        {
            return val == 0 || val is null ? string.Empty : val.Value.ToString("G29");
        }

        public static string ToAccountingFormat(this decimal val, bool negate = false, string zeroString = "-")
        {
            if (negate)
            {
                return val == 0 ? zeroString : val.ToString("(#,##0.00)");
            }

            return val == 0 ? zeroString : val.ToString("#,##0.00");
        }

        public static string ToFormattedString(this int val)
        {
            return val == 0 ? string.Empty : val.ToString();
        }
    }
}

