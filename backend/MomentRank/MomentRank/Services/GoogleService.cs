using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace MomentRank.Services
{
    public interface IGoogleService
    {
        Task<GoogleUserInfo?> VerifyGoogleTokenAsync(string idToken);
    }

    public class GoogleService : IGoogleService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GoogleService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<GoogleUserInfo?> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                // Verify the ID token with Google
                var response = await _httpClient.GetAsync(
                    $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var tokenInfo = JsonSerializer.Deserialize<GoogleTokenInfo>(content);

                if (tokenInfo == null)
                {
                    return null;
                }

                // Optionally verify the audience (client ID) matches your app
                // var expectedClientId = _configuration["Authentication:Google:ClientId"];
                if (tokenInfo.aud != "755918280086-cnt76mvrp4j7323c0qiujelule7mbn6k.apps.googleusercontent.com" || tokenInfo.aud != "755918280086-lg9aqpg6o5pb9dq4ra5didcd3vbfjste.apps.googleusercontent.com")
                {
                    return null;
                }

                return new GoogleUserInfo
                {
                    Id = tokenInfo.sub,
                    Email = tokenInfo.email,
                    Name = tokenInfo.name,
                    GivenName = tokenInfo.given_name,
                    FamilyName = tokenInfo.family_name,
                    Picture = tokenInfo.picture,
                    EmailVerified = tokenInfo.email_verified == "true"
                };
            }
            catch (Exception)
            {
                return null;
            }
        }
    }

    public class GoogleTokenInfo
    {
        public string sub { get; set; } = string.Empty;
        public string email { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string given_name { get; set; } = string.Empty;
        public string family_name { get; set; } = string.Empty;
        public string picture { get; set; } = string.Empty;
        public string email_verified { get; set; } = string.Empty;
        public string aud { get; set; } = string.Empty;
    }

    public class GoogleUserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string GivenName { get; set; } = string.Empty;
        public string FamilyName { get; set; } = string.Empty;
        public string Picture { get; set; } = string.Empty;
        public bool EmailVerified { get; set; }
    }
}
