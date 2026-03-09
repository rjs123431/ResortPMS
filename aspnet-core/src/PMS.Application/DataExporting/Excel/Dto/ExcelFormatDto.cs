namespace PMS.DataExporting.Excel.Dto
{
    public class ExcelFormatDto
    {
        public string NumberFormat { get; set; }

        public OfficeOpenXml.Style.ExcelHorizontalAlignment? HorizontalAlignment { get; set; }

        public System.Drawing.Color BackgroundColor { get; set; }

        public bool? TextBold { get; set; }

    }
}





