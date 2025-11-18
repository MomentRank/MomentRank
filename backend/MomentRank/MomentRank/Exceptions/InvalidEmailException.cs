public class InvalidEmailException : Exception
{
    public InvalidEmailException(string email)
        : base($"Email '{email}' is not valid.") { }
}