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
                File.AppendAllText("Logs/errors.log",
                    $"{DateTime.UtcNow}: {ex}\n");
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
                File.AppendAllText("Logs/errors.log",
                    $"{DateTime.UtcNow}: {ex}\n");
                throw;
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
                    throw new UserNotFoundException(request.Email);


                var token = GenerateJwtToken(user);
                return token;
            }
            catch (Exception ex)
            {
                File.AppendAllText("Logs/errors.log",
                    $"{DateTime.UtcNow}: {ex}\n");
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
                File.AppendAllText("Logs/errors.log",
                    $"{DateTime.UtcNow}: {ex}\n");
                throw;
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