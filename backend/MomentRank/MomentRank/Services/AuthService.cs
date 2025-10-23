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
                {
                    return null; // Invalid email
                }

                if (!request.Username.IsValidUsername())
                {
                    return null; // Invalid username
                }

                if (!request.Password.IsValidPassword())
                {
                    return null; // Invalid password
                }

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() ||
                                            u.Username.ToLower() == request.Username.ToLower());

                if (existingUser != null)
                {
                    return null; // User already exists
                }

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
                return null;
            }
        }

        public async Task<string?> LoginAsync(LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (user == null)
                {
                    return null;
                }

                if (!VerifyPassword(request.Password, user.PasswordHash))
                {
                    return null;
                }

                var token = GenerateJwtToken(user);
                return token;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<string?> FacebookLoginAsync(LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (user == null)
                {
                    var registerRequest = new RegisterRequest
                    {
                        Email = request.Email.ToLower(),
                        Username = request.Email.ToLower(),
                        Password = "LabaiSlaptasRaktas123!"
                    };
                    user = await RegisterAsync(registerRequest);
                }

                if (user == null)
                {
                    return null;
                }

                var token = GenerateJwtToken(user);
                return token;
            }
            catch (Exception ex)
            {
                return null;
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
                return null;
            }
        }


        private string HashPassword(string password)
        {
            // TODO: implement password hashing.
            return password;
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            return HashPassword(password).Equals(hashedPassword);
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