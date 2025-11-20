using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using Xunit;

namespace MomentRank.IntegrationTests;

public class ProfileControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProfileControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        }
    }

    private async Task<(User User, string Token)> CreateAndAuthenticateUserAsync()
    {
        var username = $"user_{Guid.NewGuid().ToString().Substring(0, 8)}";
        var email = $"user_{Guid.NewGuid()}@example.com";
        var password = "Password123!";

        var registerRequest = new RegisterRequest
        {
            Username = username,
            Email = email,
            Password = password
        };
        await _client.PostAsJsonAsync("/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = password
        };

        var response = await _client.PostAsJsonAsync("/auth/login", loginRequest);
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == email);
            return (user, loginResponse!.Access_token);
        }
    }

    [Fact]
    public async Task CreateProfile_WithValidData_ReturnsOk()
    {
        // Arrange
        var (user, token) = await CreateAndAuthenticateUserAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateProfileRequest
        {
            Name = "Test User",
            Bio = "This is a test bio"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/profile/create", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        profile.Should().NotBeNull();
        profile!.Name.Should().Be(request.Name);
        profile.Bio.Should().Be(request.Bio);
    }

    [Fact]
    public async Task GetProfile_ReturnsProfile()
    {
        // Arrange
        var (user, token) = await CreateAndAuthenticateUserAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateProfileRequest
        {
            Name = "Test User",
            Bio = "This is a test bio"
        };
        await _client.PostAsJsonAsync("/profile/create", createRequest);

        // Act
        var response = await _client.PostAsync("/profile/get", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        profile.Should().NotBeNull();
        profile!.Name.Should().Be(createRequest.Name);
    }

    [Fact]
    public async Task UpdateProfile_WithValidData_ReturnsOk()
    {
        // Arrange
        var (user, token) = await CreateAndAuthenticateUserAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateProfileRequest
        {
            Name = "Test User",
            Bio = "This is a test bio"
        };
        await _client.PostAsJsonAsync("/profile/create", createRequest);

        var updateRequest = new UpdateProfileRequest
        {
            Name = "Updated Name",
            Bio = "Updated Bio"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/profile/update", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        profile.Should().NotBeNull();
        profile!.Name.Should().Be(updateRequest.Name);
        profile.Bio.Should().Be(updateRequest.Bio);
    }
}
