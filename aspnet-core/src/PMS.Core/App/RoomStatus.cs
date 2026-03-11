namespace PMS.App;

/// <summary>Describes whether a room can be sold or is occupied.</summary>
public enum RoomOperationalStatus
{
    Vacant = 1,
    Occupied = 2,
    Reserved = 3,
    OutOfOrder = 4,
    OutOfService = 5,
}

/// <summary>Describes the cleanliness state of a room.</summary>
public enum HousekeepingStatus
{
    Clean = 1,
    Dirty = 2,
    Inspected = 3,
    Pickup = 4,
}

public enum HousekeepingTaskType
{
    CheckoutCleaning = 1,
    StayoverCleaning = 2,
    PickupCleaning = 3,
    Inspection = 4,
}

public enum HousekeepingTaskStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
}
