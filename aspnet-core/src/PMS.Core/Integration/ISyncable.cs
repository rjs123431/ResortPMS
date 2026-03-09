using System;

namespace PMS.Integration;

/// <summary>
/// Interface for entities that support synchronization tracking
/// </summary>
public interface ISyncable
{
    /// <summary>
    /// Timestamp of the last synchronization
    /// </summary>
    DateTime? LastSyncTime { get; set; }
}
