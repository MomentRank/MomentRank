using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Extensions;
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
        private readonly IGoogleService _googleService;

        public AuthController(IAuthService authService, IConfiguration config, IGoogleService googleService)
        {
            _authService = authService;
            _config = config;
            _googleService = googleService;
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

            try
            {
                var token = await _authService.LoginAsync(request);
                if (token == null)
                {
                    return Unauthorized();
                }

                return Ok(new LoginResponse { Access_token = token });
            }
            catch (Exception ex) when (ex is UserNotFoundException || ex is InvalidCredentialsException)
            {
                return Unauthorized();
            }
        }
        
        // GOOGLE LOGIN ENDPOINT

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { message = "Token is required" });
            }

            try
            {
                // Verify the Google ID token
                var userInfo = await _googleService.VerifyGoogleTokenAsync(request.Token);

                if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
                {
                    return Unauthorized(new { message = "Invalid Google token" });
                }

                // Check if the email is verified
                if (!userInfo.EmailVerified)
                {
                    return Unauthorized(new { message = "Email not verified with Google" });
                }

                // Authenticate or create user
                var loginRequest = new LoginRequest
                {
                    Email = userInfo.Email,
                    Password = ""
                };

                var (jwt, firstTimeLogin, user) = await _authService.GoogleLoginAsync(loginRequest);

                if (jwt == null || user == null)
                {
                    return Unauthorized(new { message = "Authentication failed" });
                }
                

                return Ok(new
                {
                    token = jwt,
                    firstTimeLogin = firstTimeLogin,
                    user = new
                    {
                        id = user?.Id,
                        email = user?.Email,
                        username = user?.Username,
                        name = userInfo.Name,
                        picture = userInfo.Picture
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Google auth error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred during Google authentication", error = ex.Message });
            }
        }

        [HttpGet("validation-requirements")]
        public IActionResult GetValidationRequirements()
        {
            return Ok(new
            {
                PasswordRequirements = ValidationExtensions.GetPasswordRequirements(),
                UsernameRequirements = ValidationExtensions.GetUsernameRequirements(),
                EmailRequirements = "Email must be a valid email address format"
            });
        }
    }
}
