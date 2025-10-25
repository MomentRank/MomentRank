using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("friends")]
    [Authorize]
    public class FriendController : ControllerBase
    {
        private readonly IFriendService _friendService;
        private readonly ApplicationDbContext _context;

        public FriendController(IFriendService friendService, ApplicationDbContext context)
        {
            _friendService = friendService;
            _context = context;
        }

        [HttpPost("request/send")]
        public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var result = await _friendService.SendFriendRequestAsync(user, request.ReceiverId);
            if (result == null)
            {
                return BadRequest("Unable to send friend request. User may not exist, you may already be friends, or a request already exists.");
            }

            return Ok(result);
        }

        [HttpPost("request/respond")]
        public async Task<IActionResult> RespondToFriendRequest([FromBody] RespondToFriendRequestRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var result = await _friendService.RespondToFriendRequestAsync(user, request.RequestId, request.Accept);
            if (result == null)
            {
                return BadRequest("Unable to respond to friend request. Request may not exist or you may not be authorized.");
            }

            return Ok(result);
        }

        [HttpPost("request/cancel/{requestId}")]
        public async Task<IActionResult> CancelFriendRequest(int requestId)
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
        public async Task<IActionResult> RemoveFriend(int friendId)
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
        public async Task<IActionResult> GetPendingReceivedRequests()
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
        public async Task<IActionResult> GetPendingSentRequests()
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
        public async Task<IActionResult> GetFriends()
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
        public async Task<IActionResult> GetFriendRequestStatus(int userId)
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
        public async Task<IActionResult> CheckIfFriends(int userId)
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
}
