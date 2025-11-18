public class InvalidUsernameException : Exception
{
    public InvalidUsernameException(string username)
        : base($"Username '{username}' is not valid.") { }
}
