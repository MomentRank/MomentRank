using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    public abstract class GenericFriendController<TService, TContext> : ControllerBase
        where TService : class, IFriendService
        where TContext : ApplicationDbContext
    {
        protected readonly TService _friendService;
        protected readonly TContext _context;

        protected GenericFriendController(TService friendService, TContext context)
        {
            _friendService = friendService;
            _context = context;
        }

        
        protected async Task<IActionResult> ExecuteWithUserAsync<TResult>(Func<User, Task<TResult?>> work, string? nullErrorMessage = null)
            where TResult : class
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var result = await work(user);
            if (result == null)
            {
                return BadRequest(nullErrorMessage ?? "Bad request");
            }

            return Ok(result);
        }

        [HttpPost("request/send")]
        public virtual async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestRequest request)
        {
            return await ExecuteWithUserAsync(async user =>
            {
                return await _friendService.SendFriendRequestAsync(user, request.ReceiverId);
            }, "Unable to send friend request. User may not exist, you may already be friends, or a request already exists.");
        }

        [HttpPost("request/respond")]
        public virtual async Task<IActionResult> RespondToFriendRequest([FromBody] RespondToFriendRequestRequest request)
        {
            return await ExecuteWithUserAsync(async user =>
            {
                return await _friendService.RespondToFriendRequestAsync(user, request.RequestId, request.Accept);
            }, "Unable to respond to friend request. Request may not exist or you may not be authorized.");
        }

        [HttpPost("request/cancel/{requestId}")]
        public virtual async Task<IActionResult> CancelFriendRequest(int requestId)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var success = await _friendService.CancelFriendRequestAsync(user, requestId);
            if (!success)
            {
                return BadRequest("Unable to cancel friend request. Request may not exist or you may not be authorized.");
            }

            return Ok(new { message = "Friend request cancelled successfully" });
        }

        [HttpPost("remove/{friendId}")]
        public virtual async Task<IActionResult> RemoveFriend(int friendId)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var success = await _friendService.RemoveFriendAsync(user, friendId);
            if (!success)
            {
                return BadRequest("Unable to remove friend. Friendship may not exist.");
            }

            return Ok(new { message = "Friend removed successfully" });
        }

        [HttpGet("requests/received")]
        public virtual async Task<IActionResult> GetPendingReceivedRequests()
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var requests = await _friendService.GetPendingReceivedRequestsAsync(user);
            return Ok(requests);
        }

        [HttpGet("requests/sent")]
        public virtual async Task<IActionResult> GetPendingSentRequests()
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var requests = await _friendService.GetPendingSentRequestsAsync(user);
            return Ok(requests);
        }

        [HttpGet]
        public virtual async Task<IActionResult> GetFriends()
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var friends = await _friendService.GetFriendsAsync(user);
            return Ok(friends);
        }

        [HttpGet("status/{userId}")]
        public virtual async Task<IActionResult> GetFriendRequestStatus(int userId)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var status = await _friendService.GetFriendRequestStatusAsync(user, userId);
            if (status == null)
            {
                return Ok(new { message = "No friend request exists between these users" });
            }

            return Ok(status);
        }

        [HttpGet("check/{userId}")]
        public virtual async Task<IActionResult> CheckIfFriends(int userId)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var areFriends = await _friendService.AreFriendsAsync(user.Id, userId);
            return Ok(new { areFriends });
        }
    }

    [ApiController]
    [Route("friends")]
    [Authorize]
    public class FriendController : GenericFriendController<IFriendService, ApplicationDbContext>
    {
        public FriendController(IFriendService friendService, ApplicationDbContext context)
            : base(friendService, context)
        {
        }
    }
}
