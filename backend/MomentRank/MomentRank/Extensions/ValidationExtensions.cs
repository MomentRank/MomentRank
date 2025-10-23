using System.Text.RegularExpressions;

namespace MomentRank.Extensions
{
    public static class ValidationExtensions
    {
        private static readonly Regex EmailRegex = new Regex(
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static bool IsValidEmail(this string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            return EmailRegex.IsMatch(email) && email.Length <= 255;
        }

        public static bool IsValidUsername(this string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            // Username requirements:
            // - 3-20 characters
            // - Only letters, numbers, underscores, and hyphens
            // - Must start with letter or number
            // - No consecutive special characters
            if (username.Length < 3 || username.Length > 20)
                return false;

            if (!char.IsLetterOrDigit(username[0]))
                return false;

            var validCharsRegex = new Regex(@"^[a-zA-Z0-9_-]+$");
            if (!validCharsRegex.IsMatch(username))
                return false;

            // No consecutive special characters
            for (int i = 1; i < username.Length; i++)
            {
                if ((username[i] == '_' || username[i] == '-') && 
                    (username[i-1] == '_' || username[i-1] == '-'))
                    return false;
            }

            return true;
        }

        public static bool IsValidPassword(this string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            // Password requirements:
            // - At least 8 characters
            // - At least one uppercase letter
            // - At least one lowercase letter
            // - At least one number
            // - At least one special character
            if (password.Length < 8)
                return false;

            bool hasUpper = password.Any(char.IsUpper);
            bool hasLower = password.Any(char.IsLower);
            bool hasDigit = password.Any(char.IsDigit);
            bool hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));

            return hasUpper && hasLower && hasDigit && hasSpecial;
        }

        public static string GetPasswordRequirements()
        {
            return "Password must contain:\n" +
                   "• At least 8 characters\n" +
                   "• At least one uppercase letter (A-Z)\n" +
                   "• At least one lowercase letter (a-z)\n" +
                   "• At least one number (0-9)\n" +
                   "• At least one special character (!@#$%^&*)";
        }

        public static string GetUsernameRequirements()
        {
            return "Username must:\n" +
                   "• Be 3-20 characters long\n" +
                   "• Start with a letter or number\n" +
                   "• Only contain letters, numbers, underscores (_), and hyphens (-)\n" +
                   "• Not have consecutive special characters";
        }
    }
}
