using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using Xunit;

namespace MomentRank.IntegrationTests;

public class EventControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public EventControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        }
    }

    private async Task<string> AuthenticateAsync()
    {
        var registerRequest = new RegisterRequest
        {
            Username = $"user_{Guid.NewGuid().ToString().Substring(0, 8)}",
            Email = $"user_{Guid.NewGuid()}@example.com",
            Password = "Password123!"
        };
        await _client.PostAsJsonAsync("/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = registerRequest.Email,
            Password = registerRequest.Password
        };

        var response = await _client.PostAsJsonAsync("/auth/login", loginRequest);
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
            CreatedAt = DateTime.UtcNow,
            EndsAt = DateTime.UtcNow.AddDays(1)
        };

        // Act
        var response = await _client.PostAsJsonAsync("/event/create", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UploadPhoto_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await AuthenticateAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create Event
        var createEventRequest = new CreateEventRequest
        {
            Name = "Photo Event",
            Public = true,
            CreatedAt = DateTime.UtcNow,
            EndsAt = DateTime.UtcNow.AddDays(1)
        };
        var eventResponse = await _client.PostAsJsonAsync("/event/create", createEventRequest);
        var eventResult = await eventResponse.Content.ReadFromJsonAsync<Event>();

        var uploadRequest = new Base64UploadRequest
        {
            EventId = eventResult!.Id,
            FileData = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", // 1x1 GIF
            FileName = "test.gif",
            ContentType = "image/gif",
            Caption = "Test Photo"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/event/photos/upload-base64", uploadRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var photo = await response.Content.ReadFromJsonAsync<PhotoResponse>();
        photo.Should().NotBeNull();
        photo!.FileName.Should().Be(uploadRequest.FileName);
    }

}
