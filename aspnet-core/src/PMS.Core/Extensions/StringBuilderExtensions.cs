using System;
using System.Text;

namespace PMS.Extensions;

public static class StringBuilderExtensions
{
    public static string AppendString(this StringBuilder str, string data, bool newLine = true)
    {
        if (newLine && str.Length > 0)
            str.Append(Environment.NewLine);

        if (!newLine && str.Length > 0)
            str.Append(",");

        str.Append($"\"{data}\"");


        return str.ToString();
    }
}

