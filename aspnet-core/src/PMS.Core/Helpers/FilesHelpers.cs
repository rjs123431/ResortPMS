using System;
using System.IO;

namespace PMS.Helpers;

public static class FilesHelpers
{
    public static byte[] GetBytesFromFile(string filename)
    {
        try
        {
            byte[] bytes = File.ReadAllBytes(filename);
            return bytes;
        }
        catch (FileNotFoundException)
        {
            Console.WriteLine($"The file '{filename}' was not found.");
        }
        catch (Exception e)
        {
            Console.WriteLine($"An error occurred: {e.Message}");
        }

        return null;
    }
}

