using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new AuthService(_context);
        }

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
            result.Email.Should().Be(request.Email);
            
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
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
        public async Task RegisterAsync_ShouldThrowException_WhenUserExists()
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
        public async Task LoginAsync_ShouldReturnToken_WhenCredentialsValid()
        {
            // Register a user first (using the service to ensure hashing is correct)
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
    }
}
