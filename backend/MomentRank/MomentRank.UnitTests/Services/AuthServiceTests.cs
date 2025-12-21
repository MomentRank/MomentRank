using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using Moq;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _service;
        private readonly Mock<IConfiguration> _mockConfiguration;

        public AuthServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(c => c["JwtSettings:Secret"])
                .Returns("ThisIsAVeryLongSecretKeyForTestingPurposesOnly12345");

            _service = new AuthService(_context, _mockConfiguration.Object);
        }

        #region RegisterAsync Tests

        [Fact]
        public async Task RegisterAsync_ShouldCreateUser_WhenValid()
        {
            var request = new RegisterRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "Password123!"
            };

            var result = await _service.RegisterAsync(request);

            result.Should().NotBeNull();
            result!.Username.Should().Be(request.Username);
            result.Email.Should().Be(request.Email.ToLower());

            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            userInDb.Should().NotBeNull();
        }

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenEmailInvalid()
        {
            var request = new RegisterRequest
            {
                Username = "testuser",
                Email = "invalid-email",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<InvalidEmailException>(() => _service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenUsernameInvalid()
        {
            var request = new RegisterRequest
            {
                Username = "ab", // Too short
                Email = "test@example.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<InvalidUsernameException>(() => _service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenPasswordInvalid()
        {
            var request = new RegisterRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "weak" // Does not meet requirements
            };

            await Assert.ThrowsAsync<InvalidPasswordException>(() => _service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenEmailExists()
        {
            var existingUser = new User
            {
                Username = "existing",
                Email = "existing@example.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var request = new RegisterRequest
            {
                Username = "newuser",
                Email = "existing@example.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<UserAlreadyExistsException>(() => _service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenUsernameExists()
        {
            var existingUser = new User
            {
                Username = "existinguser",
                Email = "existing@example.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var request = new RegisterRequest
            {
                Username = "existinguser",
                Email = "new@example.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<UserAlreadyExistsException>(() => _service.RegisterAsync(request));
        }

        #endregion

        #region LoginAsync Tests

        [Fact]
        public async Task LoginAsync_ShouldReturnToken_WhenCredentialsValid()
        {
            var registerRequest = new RegisterRequest
            {
                Username = "loginuser",
                Email = "login@example.com",
                Password = "Password123!"
            };
            await _service.RegisterAsync(registerRequest);

            var loginRequest = new LoginRequest
            {
                Email = "login@example.com",
                Password = "Password123!"
            };

            var token = await _service.LoginAsync(loginRequest);

            token.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task LoginAsync_ShouldThrowException_WhenUserNotFound()
        {
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<UserNotFoundException>(() => _service.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_ShouldThrowException_WhenPasswordInvalid()
        {
            var registerRequest = new RegisterRequest
            {
                Username = "loginuser2",
                Email = "login2@example.com",
                Password = "Password123!"
            };
            await _service.RegisterAsync(registerRequest);

            var loginRequest = new LoginRequest
            {
                Email = "login2@example.com",
                Password = "WrongPassword!"
            };

            await Assert.ThrowsAsync<InvalidCredentialsException>(() => _service.LoginAsync(loginRequest));
        }

        #endregion

        #region GoogleLoginAsync Tests

        [Fact]
        public async Task GoogleLoginAsync_ShouldCreateNewUser_WhenEmailNotExists()
        {
            var loginRequest = new LoginRequest
            {
                Email = "newgoogleuser@gmail.com",
                Password = "" // Not used for Google login
            };

            var (token, isNewUser, user) = await _service.GoogleLoginAsync(loginRequest);

            token.Should().NotBeNullOrEmpty();
            isNewUser.Should().BeTrue();
            user.Should().NotBeNull();
            user!.Email.Should().Be(loginRequest.Email.ToLower());
        }

        [Fact]
        public async Task GoogleLoginAsync_ShouldReturnExistingUser_WhenEmailExists()
        {
            // First create a user
            var existingUser = new User
            {
                Username = "existinggoogle",
                Email = "existinggoogle@gmail.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var loginRequest = new LoginRequest
            {
                Email = "existinggoogle@gmail.com",
                Password = ""
            };

            var (token, isNewUser, user) = await _service.GoogleLoginAsync(loginRequest);

            token.Should().NotBeNullOrEmpty();
            isNewUser.Should().BeFalse();
            user.Should().NotBeNull();
            user!.Id.Should().Be(existingUser.Id);
        }

        [Fact]
        public async Task GoogleLoginAsync_ShouldGenerateUniqueUsername_WhenBaseExists()
        {
            // Create user with username that would be generated
            var existingUser = new User
            {
                Username = "johndoe",
                Email = "other@example.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var loginRequest = new LoginRequest
            {
                Email = "john.doe@gmail.com",
                Password = ""
            };

            var (token, isNewUser, user) = await _service.GoogleLoginAsync(loginRequest);

            user.Should().NotBeNull();
            user!.Username.Should().NotBe("johndoe"); // Should have suffix
            user.Username.Should().StartWith("johndoe");
        }

        [Fact]
        public async Task GoogleLoginAsync_ShouldHandleShortUsername_WhenEmailPrefixShort()
        {
            var loginRequest = new LoginRequest
            {
                Email = "ab@gmail.com", // Very short prefix
                Password = ""
            };

            var (token, isNewUser, user) = await _service.GoogleLoginAsync(loginRequest);

            user.Should().NotBeNull();
            user!.Username.Length.Should().BeGreaterThanOrEqualTo(3); // Should be padded
        }

        #endregion

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task GetUserByIdAsync_ShouldReturnUser_WhenExists()
        {
            var user = new User
            {
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _service.GetUserByIdAsync(user.Id);

            result.Should().NotBeNull();
            result!.Username.Should().Be(user.Username);
        }

        [Fact]
        public async Task GetUserByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            var result = await _service.GetUserByIdAsync(999);

            result.Should().BeNull();
        }

        #endregion
    }
}
