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

public class FriendControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public FriendControllerTests(CustomWebApplicationFactory factory)
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
    public async Task SendFriendRequest_WithValidUser_ReturnsOk()
    {
        // Arrange
        var (sender, senderToken) = await CreateAndAuthenticateUserAsync();
        var (receiver, _) = await CreateAndAuthenticateUserAsync();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);

        var request = new SendFriendRequestRequest { ReceiverId = receiver.Id };

        // Act
        var response = await _client.PostAsJsonAsync("/friends/request/send", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RespondToFriendRequest_Accept_ReturnsOk()
    {
        // Arrange
        var (sender, senderToken) = await CreateAndAuthenticateUserAsync();
        var (receiver, receiverToken) = await CreateAndAuthenticateUserAsync();

        // Sender sends request
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);
        var sendRequest = new SendFriendRequestRequest { ReceiverId = receiver.Id };
        await _client.PostAsJsonAsync("/friends/request/send", sendRequest);
        
        // Switch to receiver
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", receiverToken);
        var pendingResponse = await _client.GetAsync("/friends/requests/received");
        var pendingRequests = await pendingResponse.Content.ReadFromJsonAsync<List<FriendRequestResponse>>();
        var requestId = pendingRequests!.First().Id;

        var respondRequest = new RespondToFriendRequestRequest { RequestId = requestId, Accept = true };

        // Act
        var response = await _client.PostAsJsonAsync("/friends/request/respond", respondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify they are friends
        var friendsResponse = await _client.GetAsync("/friends");
        var friends = await friendsResponse.Content.ReadFromJsonAsync<List<FriendResponse>>();
        friends.Should().Contain(f => f.UserId == sender.Id);
    }

    [Fact]
    public async Task CancelFriendRequest_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var (sender, senderToken) = await CreateAndAuthenticateUserAsync();
        var (receiver, _) = await CreateAndAuthenticateUserAsync();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);
        var sendRequest = new SendFriendRequestRequest { ReceiverId = receiver.Id };
        await _client.PostAsJsonAsync("/friends/request/send", sendRequest);

        // Get the request ID (sender can see sent requests)
        var sentResponse = await _client.GetAsync("/friends/requests/sent");
        var sentRequests = await sentResponse.Content.ReadFromJsonAsync<List<FriendRequestResponse>>();
        var requestId = sentRequests!.First().Id;

        // Act
        var response = await _client.PostAsync($"/friends/request/cancel/{requestId}", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify it's gone
        var sentResponseAfter = await _client.GetAsync("/friends/requests/sent");
        var sentRequestsAfter = await sentResponseAfter.Content.ReadFromJsonAsync<List<FriendRequestResponse>>();
        sentRequestsAfter.Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveFriend_WithValidFriend_ReturnsOk()
    {
        // Arrange
        var (user1, token1) = await CreateAndAuthenticateUserAsync();
        var (user2, token2) = await CreateAndAuthenticateUserAsync();

        // Make them friends
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var sendRequest = new SendFriendRequestRequest { ReceiverId = user2.Id };
        await _client.PostAsJsonAsync("/friends/request/send", sendRequest);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);
        var pendingResponse = await _client.GetAsync("/friends/requests/received");
        var pendingRequests = await pendingResponse.Content.ReadFromJsonAsync<List<FriendRequestResponse>>();
        var requestId = pendingRequests!.First().Id;
        var respondRequest = new RespondToFriendRequestRequest { RequestId = requestId, Accept = true };
        await _client.PostAsJsonAsync("/friends/request/respond", respondRequest);

        // Act - User1 removes User2
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var response = await _client.PostAsync($"/friends/remove/{user2.Id}", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify they are not friends
        var friendsResponse = await _client.GetAsync("/friends");
        var friends = await friendsResponse.Content.ReadFromJsonAsync<List<FriendResponse>>();
        friends.Should().BeEmpty();
    }
}
