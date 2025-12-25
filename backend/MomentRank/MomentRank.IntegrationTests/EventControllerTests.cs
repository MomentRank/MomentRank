using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MomentRank.Data;
using MomentRank.DTOs;
using Xunit;

namespace MomentRank.IntegrationTests;

public class EventControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public EventControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsync()
    {
        var registerRequest = new RegisterRequest
        {
            Username = $"user_{Guid.NewGuid().ToString().Substring(0, 8)}",
            Email = $"user_{Guid.NewGuid()}@example.com",
            Password = "Password123!"
        };
        var registerResponse = await _client.PostAsJsonAsync("/auth/register", registerRequest);
        registerResponse.EnsureSuccessStatusCode();

        var loginRequest = new LoginRequest
        {
            Email = registerRequest.Email,
            Password = registerRequest.Password
        };

        var response = await _client.PostAsJsonAsync("/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return loginResponse!.Access_token;
    }

    [Fact]
    public async Task CreateEvent_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await AuthenticateAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateEventRequest
        {
            Name = "Test Event",
            Public = true,
            EndsAt = DateTime.UtcNow.AddDays(1)
        };

        // Act
        var response = await _client.PostAsJsonAsync("/event/create", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
