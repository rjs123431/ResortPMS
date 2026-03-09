namespace PMS.Dto;

public class DeleteEntityInput<T>
{
    public T Id { get; set; }
    public string Reason { get; set; }
}

