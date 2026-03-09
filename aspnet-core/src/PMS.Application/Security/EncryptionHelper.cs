using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace PMS.Security;

public class EncryptionHelper
{
    // Symmetric key for AES encryption
    private static readonly byte[] Key = Encoding.UTF8.GetBytes("yourSecretKey123");
    private static readonly byte[] IV = Encoding.UTF8.GetBytes("1234567890123456");

    public static void EncryptFile(string inputFile, string outputFile)
    {
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = Key;
            aesAlg.IV = IV;

            using (FileStream inputFileStream = new FileStream(inputFile, FileMode.Open))
            using (FileStream outputFileStream = new FileStream(outputFile, FileMode.Create))
            using (ICryptoTransform encryptor = aesAlg.CreateEncryptor())
            using (CryptoStream cryptoStream = new CryptoStream(outputFileStream, encryptor, CryptoStreamMode.Write))
            {
                inputFileStream.CopyTo(cryptoStream);
            }
        }
    }

    public static void DecryptFile(string inputFile, string outputFile)
    {
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = Key;
            aesAlg.IV = IV;

            using (FileStream inputFileStream = new FileStream(inputFile, FileMode.Open))
            using (FileStream outputFileStream = new FileStream(outputFile, FileMode.Create))
            using (ICryptoTransform decryptor = aesAlg.CreateDecryptor())
            using (CryptoStream cryptoStream = new CryptoStream(inputFileStream, decryptor, CryptoStreamMode.Read))
            {
                cryptoStream.CopyTo(outputFileStream);
            }
        }
    }
}

