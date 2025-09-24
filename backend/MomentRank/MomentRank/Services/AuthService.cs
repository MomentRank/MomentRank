using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MomentRank.Models;
using MomentRank.Services;
using MomentRank.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


namespace MomentRank.Services
{
    public class AuthService : IAuthService
    {
        public AuthService()
        {
        }

        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            // TODO: implement registration with a database.
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = request.Password // TODO: implement password hashing for secure storage
            };
            return user;
        }

        public async Task<string?> LoginAsync(LoginRequest request)
        {
            // TODO: implement login with a database.
            return "THIS_IS_A_PLACEHOLDER_TOKEN";
        }
    }
}