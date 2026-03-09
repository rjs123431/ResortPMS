using Abp.Collections.Extensions;
using Abp.Dependency;
using Abp.Extensions;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using PMS.Dto;
using PMS.Net.MimeTypes;
using PMS.Storage;
using System;
using System.Collections.Generic;
using System.IO;

namespace PMS.DataExporting.Excel.NPOI
{
    public abstract class NpoiExcelExporterBase : PMSServiceBase, ITransientDependency
    {
        private readonly ITempFileCacheManager _tempFileCacheManager;

        private IWorkbook _workbook;

        private readonly Dictionary<string, ICellStyle> _dateCellStyles = new();
        private readonly Dictionary<string, IDataFormat> _dateDateDataFormats = new();

        private ICellStyle GetDateCellStyle(ICell cell, string dateFormat)
        {
            if (_workbook != cell.Sheet.Workbook)
            {
                _dateCellStyles.Clear();
                _dateDateDataFormats.Clear();
                _workbook = cell.Sheet.Workbook;
            }

            if (_dateCellStyles.ContainsKey(dateFormat))
            {
                return _dateCellStyles.GetValueOrDefault(dateFormat);
            }

            var cellStyle = cell.Sheet.Workbook.CreateCellStyle();
            _dateCellStyles.Add(dateFormat, cellStyle);
            return cellStyle;
        }

        private IDataFormat GetDateDataFormat(ICell cell, string dateFormat)
        {
            if (_workbook != cell.Sheet.Workbook)
            {
                _dateDateDataFormats.Clear();
                _workbook = cell.Sheet.Workbook;
            }

            if (_dateDateDataFormats.ContainsKey(dateFormat))
            {
                return _dateDateDataFormats.GetValueOrDefault(dateFormat);
            }

            var dataFormat = cell.Sheet.Workbook.CreateDataFormat();
            _dateDateDataFormats.Add(dateFormat, dataFormat);
            return dataFormat;
        }

        protected NpoiExcelExporterBase(ITempFileCacheManager tempFileCacheManager)
        {
            _tempFileCacheManager = tempFileCacheManager;
        }

        protected FileDto CreateExcelPackage(string fileName, Action<XSSFWorkbook> creator)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndOpenxmlformatsOfficedocumentSpreadsheetmlSheet);
            var workbook = new XSSFWorkbook();

            creator(workbook);

            Save(workbook, file);

            return file;
        }

        protected FileDto CreateExcelPackage(string fileName, Action<XSSFWorkbook> creator, byte[] fileBytes)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndOpenxmlformatsOfficedocumentSpreadsheetmlSheet);

            using (var stream = new MemoryStream(fileBytes))
            {
                var workbook = new XSSFWorkbook(stream);

                creator(workbook);

                Save(workbook, file);
            }


            return file;
        }

        protected FileDto CreateExcelPackageOldFormat(string fileName, Action<HSSFWorkbook> creator)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndOpenxmlformatsOfficedocumentSpreadsheetmlSheet);

            var workbook = new HSSFWorkbook();

            creator(workbook);

            SaveOldFormat(workbook, file);

            return file;
        }

        protected FileDto CreateExcelPackageOldFormat(string fileName, Action<HSSFWorkbook> creator, byte[] fileBytes)
        {
            var file = new FileDto(fileName, MimeTypeNames.ApplicationVndOpenxmlformatsOfficedocumentSpreadsheetmlSheet);

            using var stream = new MemoryStream(fileBytes);
            var workbook = new HSSFWorkbook(stream);

            creator(workbook);

            SaveOldFormat(workbook, file);

            return file;
        }

        protected void AddHeader(ISheet sheet, params string[] headerTexts)
        {
            if (headerTexts.IsNullOrEmpty())
            {
                return;
            }

            sheet.CreateRow(0);

            for (var i = 0; i < headerTexts.Length; i++)
            {
                AddHeader(sheet, 0, i, headerTexts[i]);
            }
        }

        protected void AddHeader(int rowIndex, ISheet sheet, params string[] headerTexts)
        {
            if (headerTexts.IsNullOrEmpty())
            {
                return;
            }

            sheet.CreateRow(rowIndex);

            for (var i = 0; i < headerTexts.Length; i++)
            {
                AddHeader(sheet,  rowIndex, i, headerTexts[i]);
            }
        }

        protected void AddHeader(ISheet sheet, int rowIndex, int columnIndex, string headerText)
        {
            var cell = sheet.GetRow(rowIndex).CreateCell(columnIndex);
            cell.SetCellValue(headerText);
            var cellStyle = sheet.Workbook.CreateCellStyle();
            var font = sheet.Workbook.CreateFont();
            font.IsBold = true;
            font.FontHeightInPoints = 12;
            cellStyle.SetFont(font);
            cell.CellStyle = cellStyle;
        }

        protected void AddObjects<T>(ISheet sheet, IList<T> items, params Func<T, object>[] propertySelectors)
        {
            if (items.IsNullOrEmpty() || propertySelectors.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 1; i <= items.Count; i++)
            {
                var row = sheet.CreateRow(i);

                for (var j = 0; j < propertySelectors.Length; j++)
                {
                    var cell = row.CreateCell(j);
                    var value = propertySelectors[j](items[i - 1]);
                    if (value != null)
                    {
                        cell.SetCellValue(value.ToString());
                    }
                }
            }
        }

        protected void AddObjects<T>(int rowIndex, ISheet sheet, IList<T> items, params Func<T, object>[] propertySelectors)
        {
            if (items.IsNullOrEmpty() || propertySelectors.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 1; i <= items.Count; i++)
            {
                var row = sheet.CreateRow(i + rowIndex);

                for (var j = 0; j < propertySelectors.Length; j++)
                {
                    var cell = row.CreateCell(j);
                    var value = propertySelectors[j](items[i - 1]);
                    if (value != null)
                    {
                        cell.SetCellValue(value.ToString());
                    }
                }
            }
        }

        protected void AddObjects<T>(ISheet sheet, IList<T> items, params string[] propertyNames)
        {
            if (items.IsNullOrEmpty() || propertyNames.IsNullOrEmpty())
            {
                return;
            }

            for (var i = 1; i <= items.Count; i++)
            {
                var row = sheet.CreateRow(i);

                for (var j = 0; j < propertyNames.Length; j++)
                {
                    var cell = row.CreateCell(j);
                    try
                    {
                        var type = GetPropertyType(items[i - 1], propertyNames[j]);
                        if (type == typeof(int?) || type == typeof(int))
                        {
                            var value = (int)GetPropertyValue(items[i - 1], propertyNames[j]);
                            cell.SetCellValue(value);
                        }
                        else if (type == typeof(decimal))
                        {
                            var value = (decimal)GetPropertyValue(items[i - 1], propertyNames[j]);
                            cell.SetCellValue(Convert.ToDouble(value));

                            // Set the cell style to represent a number with 2 decimal places
                            var dataFormat = sheet.Workbook.CreateDataFormat();
                            var numericCellStyle = sheet.Workbook.CreateCellStyle();
                            numericCellStyle.DataFormat = dataFormat.GetFormat("#,##0.00");
                            cell.CellStyle = numericCellStyle;
                        }
                        else if (type == typeof(DateTime?))
                        {
                            var value = (DateTime)GetPropertyValue(items[i - 1], propertyNames[j]);
                            cell.SetCellValue(value);

                            // Set the cell style to represent a date
                            var dataFormat = sheet.Workbook.CreateDataFormat();
                            var dateCellStyle = sheet.Workbook.CreateCellStyle();
                            dateCellStyle.DataFormat = dataFormat.GetFormat("mm-dd-yyyy");
                            cell.CellStyle = dateCellStyle;
                        }
                        else
                        {
                            var value = (string)GetPropertyValue(items[i - 1], propertyNames[j]);
                            cell.SetCellValue(value);
                        }
                    }
                    catch (Exception)
                    {
                        cell.SetCellValue(string.Empty);
                    }
                }
            }
        }
        private object GetPropertyValue(object obj, string propertyName)
        {
            return obj.GetType().GetProperty(propertyName).GetValue(obj, null);
        }
        private Type GetPropertyType(object obj, string propertyName)
        {
            return obj.GetType().GetProperty(propertyName).PropertyType;
        }

        private bool IsPropertyAnInteger(object obj, string propertyName)
        {
            return GetPropertyType(obj, propertyName) == typeof(int);
        }

        protected virtual void Save(XSSFWorkbook excelPackage, FileDto file)
        {
            using (var stream = new MemoryStream())
            {
                excelPackage.Write(stream);
                _tempFileCacheManager.SetFile(file.FileToken, stream.ToArray());
            }
        }

        protected virtual void SaveOldFormat(HSSFWorkbook excelPackage, FileDto file)
        {
            using (var stream = new MemoryStream())
            {
                excelPackage.Write(stream);
                _tempFileCacheManager.SetFile(file.FileToken, stream.ToArray());
            }
        }

        protected void SetCellDateFormat(ICell cell, string dataFormat)
        {
            if (cell == null)
                return;

            var dateStyle = GetDateCellStyle(cell, dataFormat);
            var format = GetDateDataFormat(cell, dataFormat);

            dateStyle.DataFormat = format.GetFormat(dataFormat);
            cell.CellStyle = dateStyle;
            if (DateTime.TryParse(cell.StringCellValue, out var datetime))
                cell.SetCellValue(datetime);
        }

        protected void SetCellDateFormat(ISheet ws, int rowIndex, int colIndex, string dataFormat)
        {
            var row = ws.GetRow(rowIndex) ?? ws.CreateRow(rowIndex);
            var cell = row.GetCell(colIndex) ?? row.CreateCell(colIndex);
            SetCellDateFormat(cell, dataFormat);
        }

        protected void SetCellValue(ISheet ws, int rowIndex, int colIndex, string value)
        {
            var row = ws.GetRow(rowIndex) ?? ws.CreateRow(rowIndex);
            var cell = row.GetCell(colIndex) ?? row.CreateCell(colIndex);

            cell.SetCellValue(value);
        }

        protected void SetCellValue(ISheet ws, int rowIndex, int colIndex, double value)
        {
            var row = ws.GetRow(rowIndex) ?? ws.CreateRow(rowIndex);
            var cell = row.GetCell(colIndex) ?? row.CreateCell(colIndex);

            cell.SetCellValue(value);
        }

        protected void SetCellStyle(ISheet ws, int rowIndex, int colIndex, ICellStyle style)
        {
            var row = ws.GetRow(rowIndex) ?? ws.CreateRow(rowIndex);
            var cell = row.GetCell(colIndex) ?? row.CreateCell(colIndex);

            cell.CellStyle = style;
        }

        protected void SetCellFormula(ISheet ws, int rowIndex, int colIndex, string formula)
        {
            var row = ws.GetRow(rowIndex) ?? ws.CreateRow(rowIndex);
            var cell = row.GetCell(colIndex) ?? row.CreateCell(colIndex);

            cell.SetCellType(CellType.Formula);
            cell.SetCellFormula(formula);
        }

        public string NumberToExcelColumn(int colIndex)
        {
            if (colIndex < 1)
            {
                throw new ArgumentOutOfRangeException("colIndex", "Number must be greater than or equal to 1");
            }

            string result = "";
            while (colIndex > 0)
            {
                int remainder = (colIndex - 1) % 26;
                result = (char)('A' + remainder) + result;
                colIndex = (colIndex - 1) / 26;
            }

            return result;
        }
    }
}

