using FluentAssertions;
using MomentRank.Extensions;
using Xunit;

namespace MomentRank.UnitTests.Extensions
{
    public class ValidationExtensionsTests
    {
        [Theory]
        [InlineData("test@example.com", true)]
        [InlineData("user.name@domain.co.uk", true)]
        [InlineData("invalid-email", false)]
        [InlineData("@example.com", false)]
        [InlineData("user@", false)]
        [InlineData("", false)]
        [InlineData(null, false)]
        public void IsValidEmail_ShouldValidateCorrectly(string? email, bool expected)
        {
            var result = email!.IsValidEmail();
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("validUser", true)]
        [InlineData("user_name", true)]
        [InlineData("user-name", true)]
        [InlineData("u123", true)]
        [InlineData("us", false)] // Too short
        [InlineData("thisusernameiswaytoolongtobevalid", false)] // Too long
        [InlineData("_user", false)] // Starts with special char
        [InlineData("user__name", false)] // Consecutive special chars
        [InlineData("user--name", false)] // Consecutive special chars
        [InlineData("user@name", false)] // Invalid char
        [InlineData("", false)]
        [InlineData(null, false)]
        public void IsValidUsername_ShouldValidateCorrectly(string? username, bool expected)
        {
            var result = username!.IsValidUsername();
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("Password123!", true)]
        [InlineData("Pass123!", true)]
        [InlineData("password", false)] // No upper, digit, special
        [InlineData("PASSWORD", false)] // No lower, digit, special
        [InlineData("Password", false)] // No digit, special
        [InlineData("Password123", false)] // No special
        [InlineData("Pass!", false)] // Too short
        [InlineData("", false)]
        [InlineData(null, false)]
        public void IsValidPassword_ShouldValidateCorrectly(string? password, bool expected)
        {
            var result = password!.IsValidPassword();
            result.Should().Be(expected);
        }

        [Fact]
        public void GetPasswordRequirements_ShouldReturnString()
        {
            var result = ValidationExtensions.GetPasswordRequirements();
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GetUsernameRequirements_ShouldReturnString()
        {
            var result = ValidationExtensions.GetUsernameRequirements();
            result.Should().NotBeNullOrEmpty();
        }
    }
}
