using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MomentRank.Data;
using MomentRank.DTOs;
using Xunit;

namespace MomentRank.IntegrationTests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        }
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsCreated()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Username = "loginuser",
            Email = "login@example.com",
            Password = "Password123!"
        };
        await _client.PostAsJsonAsync("/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "login@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        loginResponse.Should().NotBeNull();
        loginResponse!.Access_token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
