using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text.Json;
using Xunit;
using MomentRank.Services;

namespace MomentRank.UnitTests.Services
{
    public class GoogleServiceTests
    {
        private readonly Mock<IConfiguration> _mockConfiguration;

        public GoogleServiceTests()
        {
            _mockConfiguration = new Mock<IConfiguration>();
        }

        private GoogleService CreateServiceWithMockedHttp(HttpResponseMessage response)
        {
            var mockHandler = new Mock<HttpMessageHandler>();
            mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(response);

            var httpClient = new HttpClient(mockHandler.Object);
            return new GoogleService(httpClient, _mockConfiguration.Object);
        }

        [Fact]
        public async Task VerifyGoogleTokenAsync_ShouldReturnUserInfo_WhenTokenValid()
        {
            var tokenInfo = new
            {
                sub = "google-user-id-123",
                email = "test@gmail.com",
                name = "Test User",
                given_name = "Test",
                family_name = "User",
                picture = "https://example.com/pic.jpg",
                email_verified = "true",
                aud = "test-client-id"
            };

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(tokenInfo))
            };

            var service = CreateServiceWithMockedHttp(response);

            var result = await service.VerifyGoogleTokenAsync("valid-token");

            result.Should().NotBeNull();
            result!.Id.Should().Be("google-user-id-123");
            result.Email.Should().Be("test@gmail.com");
            result.Name.Should().Be("Test User");
            result.GivenName.Should().Be("Test");
            result.FamilyName.Should().Be("User");
            result.Picture.Should().Be("https://example.com/pic.jpg");
            result.EmailVerified.Should().BeTrue();
        }

        [Fact]
        public async Task VerifyGoogleTokenAsync_ShouldReturnNull_WhenHttpFails()
        {
            var response = new HttpResponseMessage(HttpStatusCode.Unauthorized);

            var service = CreateServiceWithMockedHttp(response);

            var result = await service.VerifyGoogleTokenAsync("invalid-token");

            result.Should().BeNull();
        }

        [Fact]
        public async Task VerifyGoogleTokenAsync_ShouldReturnNull_WhenResponseIsEmpty()
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("")
            };

            var service = CreateServiceWithMockedHttp(response);

            var result = await service.VerifyGoogleTokenAsync("some-token");

            result.Should().BeNull();
        }

        [Fact]
        public async Task VerifyGoogleTokenAsync_ShouldReturnNull_WhenExceptionThrown()
        {
            var mockHandler = new Mock<HttpMessageHandler>();
            mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new HttpRequestException("Network error"));

            var httpClient = new HttpClient(mockHandler.Object);
            var service = new GoogleService(httpClient, _mockConfiguration.Object);

            var result = await service.VerifyGoogleTokenAsync("any-token");

            result.Should().BeNull();
        }

        [Fact]
        public async Task VerifyGoogleTokenAsync_ShouldReturnFalseEmailVerified_WhenNotVerified()
        {
            var tokenInfo = new
            {
                sub = "google-user-id-123",
                email = "test@gmail.com",
                name = "Test User",
                given_name = "Test",
                family_name = "User",
                picture = "",
                email_verified = "false",
                aud = "test-client-id"
            };

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(tokenInfo))
            };

            var service = CreateServiceWithMockedHttp(response);

            var result = await service.VerifyGoogleTokenAsync("valid-token");

            result.Should().NotBeNull();
            result!.EmailVerified.Should().BeFalse();
        }
    }
}
