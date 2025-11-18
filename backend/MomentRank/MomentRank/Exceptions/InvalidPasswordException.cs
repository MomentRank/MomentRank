public class InvalidPasswordException : Exception
{
    public InvalidPasswordException()
        : base("Password does not meet required complexity.") { }
}
