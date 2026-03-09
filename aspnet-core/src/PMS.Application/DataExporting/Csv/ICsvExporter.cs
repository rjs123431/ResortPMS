using PMS.Dto;
using System.Collections.Generic;
using System.Text;

namespace PMS.DataExporting.Csv
{
    public interface ICsvExporter<T> where T : class
    {
        FileDto ExportToFile(string fileName, List<T> records);
        FileDto ExportToFile(string fileName, List<string> records);
        FileDto ExportToFile(string fileName, StringBuilder str);
    }
}

