using System;

namespace PMS.Extensions;

public static class DateTimeExtensions
{
    public static DateTime RemoveSeconds(this DateTime dateTime) => dateTime.AddSeconds(dateTime.Second * -1);
    public static DateTime RemoveTime(this DateTime dateTime) => new(dateTime.Year, dateTime.Month, dateTime.Day);
}

