using System;
using System.Collections.Generic;
using Abp.Collections.Extensions;
using Abp.Dependency;
using PMS.Dto;
using PMS.Storage;
using OfficeOpenXml;
using PMS.DataExporting.Excel.Dto;
using PMS.Net.MimeTypes;
using System.IO;

namespace PMS.DataExporting.Excel.EpPlus
{
    public abstract class EpPlusExcelExporterBase : PMSServiceBase, ITransientDependency
    {
        private readonly ITempFileCacheManager _tempFileCacheManager;

        protected EpPlusExcelExporterBase(ITempFileCacheManager tempFileCacheManager)
        {
            _tempFileCacheManager = tempFileCacheManager;
        }

        protected FileDto CreateExcelPackage(string fileName, Action<ExcelPackage> creator, FileInfo fileInfo = null)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndOpenxmlformatsOfficedocumentSpreadsheetmlSheet);

            using (var excelPackage = new ExcelPackage(fileInfo))
            {
                creator(excelPackage);
                Save(excelPackage, file);
            }

            return file;
        }

        protected FileDto CreateOldExcelPackage(string fileName, Action<ExcelPackage> creator, FileInfo fileInfo = null)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndMsExcel);

            using (var excelPackage = new ExcelPackage(fileInfo))
            {
                creator(excelPackage);
                Save(excelPackage, file);
            }

            return file;
        }

        protected void AddHeader(ExcelWorksheet sheet, params string[] headerTexts)
        {
            if (headerTexts.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 0; i < headerTexts.Length; i++)
            {
                AddHeader(sheet, i + 1, headerTexts[i]);
            }
        }

        protected void AddHeader(ExcelWorksheet sheet, int columnIndex, string headerText)
        {
            sheet.Cells[1, columnIndex].Value = headerText;
            sheet.Cells[1, columnIndex].Style.Font.Bold = true;
        }

        protected void AddHeader(ExcelWorksheet sheet, int startColIndex, ExcelFormatDto format = null, params string[] headerTexts)
        {
            if (headerTexts.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 0; i < headerTexts.Length; i++)
            {
                AddHeader(sheet, i + startColIndex, headerTexts[i], format);
            }

        }

        protected void AddHeader(ExcelWorksheet sheet, int columnIndex, string headerText, ExcelFormatDto cellFormat = null)
        {
            sheet.Cells[1, columnIndex].Value = headerText;

            if (cellFormat != null)
            {
                if (!string.IsNullOrEmpty(cellFormat.NumberFormat))
                    sheet.Cells[1, columnIndex].Style.Numberformat.Format = cellFormat.NumberFormat;

                sheet.Cells[1, columnIndex].Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                sheet.Cells[1, columnIndex].Style.Fill.BackgroundColor.SetColor(cellFormat.BackgroundColor);

                if (cellFormat.HorizontalAlignment.HasValue)
                    sheet.Cells[1, columnIndex].Style.HorizontalAlignment = cellFormat.HorizontalAlignment.Value;
                if (cellFormat.TextBold.HasValue)
                    sheet.Cells[1, columnIndex].Style.Font.Bold = cellFormat.TextBold.Value;
            }

        }
        protected void AddObjects<T>(ExcelWorksheet sheet, int startRowIndex, IList<T> items, params Func<T, object>[] propertySelectors)
        {
            if (items.IsNullOrEmpty() || propertySelectors.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 0; i < items.Count; i++)
            {
                for (var j = 0; j < propertySelectors.Length; j++)
                {
                    sheet.Cells[i + startRowIndex, j + 1].Value = propertySelectors[j](items[i]);
                }
            }
        }

        protected void AddObject(ExcelWorksheet sheet, int rowIndex, int columnIndex, object cellData, ExcelFormatDto cellFormat = null)
        {
            sheet.Cells[rowIndex, columnIndex].Value = cellData;

            if (cellFormat != null)
            {
                if (!string.IsNullOrEmpty(cellFormat.NumberFormat))
                    sheet.Cells[rowIndex, columnIndex].Style.Numberformat.Format = cellFormat.NumberFormat;

                sheet.Cells[rowIndex, columnIndex].Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                sheet.Cells[rowIndex, columnIndex].Style.Fill.BackgroundColor.SetColor(cellFormat.BackgroundColor);

                if (cellFormat.HorizontalAlignment.HasValue)
                    sheet.Cells[rowIndex, columnIndex].Style.HorizontalAlignment = cellFormat.HorizontalAlignment.Value;
                if (cellFormat.TextBold.HasValue)
                    sheet.Cells[rowIndex, columnIndex].Style.Font.Bold = cellFormat.TextBold.Value;
            }

        }

        protected void Save(ExcelPackage excelPackage, FileDto file)
        {
            _tempFileCacheManager.SetFile(file.FileToken, excelPackage.GetAsByteArray());
        }
    }
}





