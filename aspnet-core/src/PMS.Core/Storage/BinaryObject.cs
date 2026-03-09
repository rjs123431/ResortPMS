using Abp;
using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS.Storage
{
    [Table("ZzzBinaryObjects")]
    public class BinaryObject : CreationAuditedEntity<Guid>, IMayHaveTenant
    {
        public virtual int? TenantId { get; set; }

        [Required]
        public virtual byte[] Bytes { get; set; }

        [MaxLength(128)]
        public virtual string FileName { get; set; }

        [MaxLength(128)]
        public virtual string FileType { get; set; }

        [MaxLength(64)]
        public virtual string Source { get; set; }

        public BinaryObject()
        {
            Id = SequentialGuidGenerator.Instance.Create();
        }

        public BinaryObject(int? tenantId, byte[] bytes, string fileName, string fileType, string source)
            : this()
        {
            TenantId = tenantId;
            Bytes = bytes;
            FileName = fileName;
            FileType = fileType;
            Source = source;
        }
    }
}





