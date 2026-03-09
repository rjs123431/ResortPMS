using Abp.Dependency;
using PMS.DataExporting.Csv.CsvHelper;
using PMS.Dto;
using PMS.Storage;
using System.Collections.Generic;
using System.Text;

namespace PMS.DataExporting.Csv
{
    public class CsvExporter<T> : CsvHelperExporterBase, ITransientDependency, ICsvExporter<T> where T : class
    {
        public CsvExporter(ITempFileCacheManager tempFileCacheManager
            ) : base(tempFileCacheManager)
        {
        }

        public FileDto ExportToFile(string fileName, List<T> records)
        {
            var file = CreateCsvPackage(fileName, records);

            return file;
        }

        public FileDto ExportToFile(string fileName, List<string> records)
        {
            var file = CreateCsvPackage(fileName, records);

            return file;
        }

        public FileDto ExportToFile(string fileName, StringBuilder str)
        {
            var file = CreateCsvPackage(fileName, str);

            return file;
        }
    }
}

