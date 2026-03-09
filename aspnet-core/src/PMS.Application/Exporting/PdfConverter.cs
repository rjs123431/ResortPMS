using Abp.Dependency;
using Microsoft.AspNetCore.Hosting;
using PMS.Dto;
using PMS.Helpers;
using PMS.Net.MimeTypes;
using PMS.Storage;
using PMS.Url;
using System;
using System.IO;
using Abp.Timing;

namespace PMS.Exporting;

public interface IPdfConverter
{
    string GetPdfPathFromUrl(string url, string fileName, int minPageLoadTime = 10);

    FileDto GeneratePdfFromUrl(string html, string fileName, int minPageLoadTime = 10);
}

public class PdfConverter : PMSServiceBase, IPdfConverter, ITransientDependency
{
    private readonly ITempFileCacheManager _tempFileCacheManager;
    private readonly IWebUrlService _webUrlService;
    private readonly IWebHostEnvironment _env;

    public PdfConverter(ITempFileCacheManager tempFileCacheManager, IWebUrlService webUrlService, IWebHostEnvironment env)
    {
        _tempFileCacheManager = tempFileCacheManager;
        _webUrlService = webUrlService;
        _env = env;
    }

    public string GetPdfPathFromUrl(string url, string fileName, int minPageLoadTime = 10)
    {
        return ConvertUrlToPdfFile(url, fileName, minPageLoadTime);
    }

    public FileDto GeneratePdfFromUrl(string url, string fileName, int minPageLoadTime = 10)
    {
        var file = new FileDto(fileName, MimeTypeNames.ApplicationPdf);

        return ConvertUrlToPdf(url, file, fileName, minPageLoadTime);
    }

    protected FileDto ConvertUrlToPdf(string url, FileDto file, string filename, int minPageLoadTime = 10)
    {
        try
        {
            var filepath = ConvertUrlToPdfFile(url, filename, minPageLoadTime);

            if (!string.IsNullOrEmpty(filepath))
            {
                var bytes = FilesHelpers.GetBytesFromFile(filepath);
                this._tempFileCacheManager.SetFile(file.FileToken, bytes);
                return file;
            }

            return null;
        }
        catch (Exception)
        {
            return null;
        }

    }

    protected string ConvertUrlToPdfFile(string url, string filename, int minPageLoadTime = 10)
    {
        var urlsSeparatedBySpaces = string.Empty;
        var pdfHtmlToPdfExePath = Path.Combine(_env.WebRootPath, "Tools\\wkhtmltopdf.exe");
        var options = new string[] { "-s Letter -O landscape"  };

        filename = filename.Replace(" ", "_");

        try
        {
            Logger.Info($"GeneratePdfFromUrl URL: {url}");
            //Determine inputs
            if ((url == null) || (url.Length == 0))
                throw new Exception("No input URLs provided for HtmlToPdf");
            else
                urlsSeparatedBySpaces = String.Join(" ", url); //Concatenate URLs

            var saveTo = Path.Combine(_env.WebRootPath, "Pdfs\\");
            var filepath = $"{saveTo}{filename}";

            if (!Directory.Exists(saveTo))
                Directory.CreateDirectory(saveTo);

            if (File.Exists(filepath))
            {
                filepath = $"{filepath.Replace(".pdf",string.Empty)}_{Clock.Now.ToString("yyyyMMddhhmmss")}.pdf";
            }

            var p = new System.Diagnostics.Process()
            {
                StartInfo =
                        {
                            FileName = pdfHtmlToPdfExePath,
                            Arguments = ((options == null) ? "" : string.Join(" ", options)) + " " + urlsSeparatedBySpaces + " " + filepath,
                            UseShellExecute = false, // needs to be false in order to redirect output
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            RedirectStandardInput = true, // redirect all 3, as it should be all 3 or none
                            WorkingDirectory = saveTo
                        }
            };

            p.Start();

            // read the output here...
            //var output = p.StandardOutput.ReadToEnd();
            var errorOutput = p.StandardError.ReadToEnd();

            // ...then wait n milliseconds for exit (as after exit, it can't read the output)
            p.WaitForExit(60000);

            // read the exit code, close process
            int returnCode = p.ExitCode;
            p.Close();

            // if 0 or 2, it worked so return path of pdf
            if ((returnCode == 0) || (returnCode == 2))
            {
                return filepath;
            }

            throw new Exception(errorOutput);
        }
        catch (Exception ex)
        {
            Logger.Error("Problem generating PDF from URLs: " + urlsSeparatedBySpaces + ", outputFilename: " + filename, ex);
            return null;
        }

    }
}


