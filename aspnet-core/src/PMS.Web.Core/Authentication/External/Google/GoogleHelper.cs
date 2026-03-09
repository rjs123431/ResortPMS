using System;
using System.Text.Json;

namespace PMS.Authentication.External.Google
{
    public static class GoogleHelper
    {
        public static string GetId(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("id").GetString();
        }

        public static string GetName(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("name").GetString();
        }

        public static string GetGivenName(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("given_name").GetString();
        }

        public static string GetFamilyName(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("family_name").GetString();
        }

        public static string GetProfile(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("link").GetString();
        }

        public static string GetEmail(JsonDocument user)
        {
            return user == null
                ? throw new ArgumentNullException(nameof(user))
                : user.RootElement.GetProperty("email").GetString();
        }
    }
}

