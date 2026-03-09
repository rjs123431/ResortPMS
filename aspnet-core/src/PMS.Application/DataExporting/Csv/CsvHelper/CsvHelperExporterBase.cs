using Abp.Dependency;
using CsvHelper;
using PMS.Dto;
using PMS.Net.MimeTypes;
using PMS.Storage;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;

namespace PMS.DataExporting.Csv.CsvHelper
{
    public abstract class CsvHelperExporterBase : PMSServiceBase, ITransientDependency
    {
        private readonly ITempFileCacheManager _tempFileCacheManager;

        protected CsvHelperExporterBase(ITempFileCacheManager tempFileCacheManager)
        {
            _tempFileCacheManager = tempFileCacheManager;
        }

        protected FileDto CreateCsvPackage<T>(string fileName, IEnumerable<T> records)
        {
            var file = new FileDto(fileName, MimeTypeNames.TextCsv);

            using (var memoryStream = new MemoryStream())
            {
                using (var streamWriter = new StreamWriter(memoryStream))
                using (var csvWriter = new CsvWriter(streamWriter, CultureInfo.InvariantCulture))
                {
                    csvWriter.WriteRecords(records);
                }
                Save(memoryStream.ToArray(), file);
            }

            return file;
        }

        protected FileDto CreateCsvPackage(string fileName, List<string> records)
        {
            var file = new FileDto(fileName, MimeTypeNames.TextCsv);

            using (var memoryStream = new MemoryStream())
            {
                using (var streamWriter = new StreamWriter(memoryStream))
                {
                    foreach (var item in records)
                        streamWriter.WriteLine(item);
                }
                Save(memoryStream.ToArray(), file);
            }

            return file;
        }

        protected FileDto CreateCsvPackage(string fileName, StringBuilder str)
        {
            var file = new FileDto(fileName, MimeTypeNames.TextCsv);

            using (var memoryStream = new MemoryStream())
            {
                using (var streamWriter = new StreamWriter(memoryStream))
                {
                    streamWriter.Write(str.ToString());
                }
                Save(memoryStream.ToArray(), file);
            }

            return file;
        }

        protected void Save(byte[] content, FileDto file)
        {
            _tempFileCacheManager.SetFile(file.FileToken, content);
        }
    }
}

