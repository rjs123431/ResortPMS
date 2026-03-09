using Abp.Auditing;
using Microsoft.AspNetCore.Mvc;
using PMS.Dto;
using PMS.Storage;
using System;
using System.Net;
using System.Threading.Tasks;

namespace PMS.Controllers
{
    public class FileController : PMSControllerBase
    {
        private readonly ITempFileCacheManager _tempFileCacheManager;
        private readonly IBinaryObjectManager _binaryObjectManager;

        public FileController(
            ITempFileCacheManager tempFileCacheManager,
            IBinaryObjectManager binaryObjectManager
        )
        {
            _tempFileCacheManager = tempFileCacheManager;
            _binaryObjectManager = binaryObjectManager;
        }

        [DisableAuditing]
        public ActionResult DownloadTempFile(FileDto file)
        {
            var fileBytes = _tempFileCacheManager.GetFile(file.FileToken);
            if (fileBytes == null)
            {
                // TOD: catch to handle gracefully
                return NotFound(L("RequestedFileDoesNotExists"));
            }

            return File(fileBytes, file.FileType, file.FileName);
        }

        [DisableAuditing]
        public ActionResult ViewTempFile(FileDto file)
        {
            var fileBytes = _tempFileCacheManager.GetFile(file.FileToken);
            if (fileBytes == null)
            {
                return NotFound(L("RequestedFileDoesNotExists"));
            }

            return File(fileBytes, file.FileType);
        }

        [DisableAuditing]
        public ActionResult GetTempFileContent(FileDto file)
        {
            var fileBytes = _tempFileCacheManager.GetFile(file.FileToken);
            if (fileBytes == null)
            {
                return NotFound(L("RequestedFileDoesNotExists"));
            }

            var fileString = System.Text.Encoding.UTF8.GetString(fileBytes);

            return Content(fileString, file.FileType);
        }

        [DisableAuditing]
        public async Task<ActionResult> Download(Guid id, string contentType, string fileName)
        {
            return await DownloadBinaryFile(id, contentType, fileName);
        }

        [DisableAuditing]
        public async Task<ActionResult> DownloadBinaryFile(Guid id, string contentType, string fileName)
        {
            var fileObject = await _binaryObjectManager.GetOrNullAsync(id);
            if (fileObject == null)
            {
                return StatusCode((int)HttpStatusCode.NotFound);
            }
            contentType ??= fileObject.FileType;
            fileName ??= fileObject.FileName;

            return File(fileObject.Bytes, contentType, fileName);
        }

        [DisableAuditing]
        public async Task<ActionResult> View(Guid id, string contentType, string fileName)
        {
            var fileObject = await _binaryObjectManager.GetOrNullAsync(id);
            if (fileObject == null)
            {
                return StatusCode((int)HttpStatusCode.NotFound);
            }

            contentType ??= fileObject.FileType;
            fileName ??= fileObject.FileName;

            if (contentType.Contains("pdf") || contentType.Contains("image") || contentType.Contains("text/plain"))
            {
                return File(fileObject.Bytes, contentType);
            }

            // download
            return File(fileObject.Bytes, contentType, fileName);
        }
    }
}

