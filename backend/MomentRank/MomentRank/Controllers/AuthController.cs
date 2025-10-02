using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Facebook;
using Microsoft.AspNetCore.Mvc;
using MomentRank.DTOs;
using MomentRank.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _config;

        public AuthController(IAuthService authService, IConfiguration config)
        {
            _authService = authService;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Password))
            {
                return BadRequest();
            }

            var user = await _authService.RegisterAsync(request);
            if (user == null)
            {
                return Conflict();
            }

            return StatusCode(201);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest();
            }

            var token = await _authService.LoginAsync(request);
            if (token == null)
            {
                return Unauthorized();
            }

            return Ok(new LoginResponse { Access_token = token });
        }

        // FACEBOOK LOGIN ENDPOINTS

        [HttpGet("facebook-login")]
        public IActionResult FacebookLogin()
        {
            var redirectUrl = Url.Action("FacebookCallback", "Auth");
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, FacebookDefaults.AuthenticationScheme);
        }

        [HttpGet("facebook-callback")]
        public async Task<IActionResult> FacebookCallback()
        {
            var result = await HttpContext.AuthenticateAsync(FacebookDefaults.AuthenticationScheme);

            if (!result.Succeeded)
                return Unauthorized();

            var claims = result.Principal.Identities.First().Claims.ToList();
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value ?? "";
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "";

            // generate JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["JwtSettings:Key"] ?? "LabaiSlaptasRaktasKurioNiekasNezino!");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, name),
                    new Claim(ClaimTypes.Email, email)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            // return same format as normal login
            return Ok(new LoginResponse { Access_token = jwt });
        }
    }
}
