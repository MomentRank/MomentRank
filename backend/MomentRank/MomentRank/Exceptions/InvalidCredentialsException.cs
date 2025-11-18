public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("Incorrect email or password.") { }
}
