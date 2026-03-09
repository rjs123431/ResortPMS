using Abp.Localization.Sources;
using OfficeOpenXml;
using System;
using System.Text;

namespace PMS.DataExporting.Excel.EpPlus;

public static class EpPlusHelpers
{
    public static string GetRequiredValueFromRowOrNull(ExcelWorksheet worksheet, int row, int column, string columnName, StringBuilder exceptionMessage, ILocalizationSource localizationSource)
    {
        var cellValue = worksheet.Cells[row, column].Value;

        if (cellValue != null && !string.IsNullOrWhiteSpace(cellValue.ToString()))
        {
            return cellValue.ToString()?.Trim();
        }

        exceptionMessage.Append(GetLocalizedExceptionMessagePart(columnName, localizationSource));
        return null;
    }

    public static DateTime? GetRequiredDateFromRowOrNull(ExcelWorksheet worksheet, int row, int column, string columnName, StringBuilder exceptionMessage, ILocalizationSource localizationSource)
    {
        var cellValue = worksheet.Cells[row, column].Value;

        if (cellValue != null && !string.IsNullOrWhiteSpace(cellValue.ToString()))
        {
            if (cellValue is int or double)
            {
                var dt = DateTime.FromOADate(Convert.ToInt32(cellValue.ToString()));
                return dt;
            }
            else
            {
                var isDate = DateTime.TryParse(cellValue.ToString(), out var dateValue);
                if (isDate)
                    return dateValue;
                else
                {
                    var dt = DateTime.FromOADate(Convert.ToInt32(cellValue.ToString()));
                    return dt;
                }
            }
        }

        exceptionMessage.Append(GetLocalizedExceptionMessagePart(columnName, localizationSource));
        return null;
    }

    public static decimal? GetRequiredDecimalFromRowOrNull(ExcelWorksheet worksheet, int row, int column, string columnName, StringBuilder exceptionMessage, ILocalizationSource localizationSource)
    {
        var cellValue = worksheet.Cells[row, column].Value;

        if (cellValue != null && !string.IsNullOrWhiteSpace(cellValue.ToString()))
        {
            var isNumber = decimal.TryParse(cellValue.ToString(), out var numberValue);
            if (isNumber)
                return numberValue;
        }

        exceptionMessage.Append(GetLocalizedExceptionMessagePart(columnName, localizationSource));
        return null;
    }

    private static string GetLocalizedExceptionMessagePart(string parameter, ILocalizationSource localizationSource)
    {
        return localizationSource.GetString("{0}IsInvalid", localizationSource.GetString(parameter)) + "; ";
    }

    public static bool IsRowEmpty(ExcelWorksheet worksheet, int row)
    {
        return worksheet.Cells[row, 1].Value == null || string.IsNullOrWhiteSpace(worksheet.Cells[row, 1].Value.ToString());
    }
}

