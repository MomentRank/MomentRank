using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using MomentRank.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;


namespace MomentRank.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly string _jwtSecret = "LabaiSlaptasRaktasKurioNiekasNezino!";
        public AuthService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            try
            {
                // Validate input
                if (!request.Email.IsValidEmail())
                    throw new InvalidEmailException(request.Email);

                if (!request.Username.IsValidUsername())
                    throw new InvalidUsernameException(request.Username);

                if (!request.Password.IsValidPassword())
                    throw new InvalidPasswordException();

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() ||
                                            u.Username.ToLower() == request.Username.ToLower());

                if (existingUser != null)
                    throw new UserAlreadyExistsException(request.Email);

                // Hash the password
                var passwordHash = HashPassword(request.Password);

                var user = new User
                {
                    Username = request.Username.Trim(),
                    Email = request.Email.Trim().ToLower(),
                    PasswordHash = passwordHash,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return user;
            }
            catch (Exception ex)
            {
                LogError(ex);
                throw;
            }
        }

        public async Task<string?> LoginAsync(LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (user == null)
                    throw new UserNotFoundException(request.Email);

                if (!VerifyPassword(request.Password, user.PasswordHash))
                    throw new InvalidCredentialsException();


                var token = GenerateJwtToken(user);
                return token;
            }
            catch (Exception ex)
            {
                LogError(ex);
                throw;
            }
        }

        public async Task<(string?, bool?, User?)> GoogleLoginAsync(LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                bool isNewUser = false;

                if (user == null)
                {
                    isNewUser = true;
                    
                    // Generate a valid username from email (before @ symbol)
                    string baseUsername = request.Email.Split('@')[0]
                        .Replace(".", "")
                        .Replace("+", "")
                        .Replace("-", "_");
                    
                    // Ensure username is valid length (3-20 characters)
                    if (baseUsername.Length > 20)
                        baseUsername = baseUsername.Substring(0, 20);
                    else if (baseUsername.Length < 3)
                        baseUsername = baseUsername + "_user";
                    
                    // Remove any trailing underscores or hyphens
                    baseUsername = baseUsername.TrimEnd('_', '-');
                    
                    // Check if username exists and add suffix if needed
                    string username = baseUsername;
                    int suffix = 1;
                    while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
                    {
                        username = $"{baseUsername}{suffix}";
                        if (username.Length > 20)
                            username = $"{baseUsername.Substring(0, 17)}{suffix}";
                        suffix++;
                    }
                    
                    var registerRequest = new RegisterRequest
                    {
                        Email = request.Email.ToLower(),
                        Username = username,
                        Password = "LabaiSlaptasRaktas123!"
                    };
                    user = await RegisterAsync(registerRequest);
                }

                if (user == null)
                    throw new UserNotFoundException(request.Email);


                var token = GenerateJwtToken(user);
                return (token, isNewUser, user);
            }
            catch (Exception ex)
            {
                LogError(ex);
                throw;
            }
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            try
            {
                return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            }
            catch (Exception ex)
            {
                LogError(ex);
                throw;
            }
        }


        private void LogError(Exception ex)
        {
            try
            {
                Directory.CreateDirectory("Logs");
                File.AppendAllText("Logs/errors.log", $"{DateTime.UtcNow}: {ex}\n");
            }
            catch
            {
                // Ignore logging errors
            }
        }

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        private string GenerateJwtToken(User user)
        {
            string jwtSecret = _jwtSecret;

            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat,
                    new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

}