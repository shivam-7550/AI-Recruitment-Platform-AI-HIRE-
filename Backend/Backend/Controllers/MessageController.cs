
using System.Security.Claims;
using Backend.DTOs.Messages;
using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize(Roles = "User,Company")]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessageController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    // =========================================================
    // GET: api/messages/conversations
    // Returns conversations for the logged-in user/company
    // =========================================================
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var role = GetUserRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        var conversations = await _messageService.GetConversationsAsync(
            userId.Value,
            role,
            cancellationToken);

        return Ok(conversations);
    }

    // =========================================================
    // GET: api/messages/conversations/{conversationId}
    // Returns one conversation after authorization check
    // =========================================================
    [HttpGet("conversations/{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var role = GetUserRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        var conversation = await _messageService.GetConversationAsync(
            conversationId,
            userId.Value,
            role,
            cancellationToken);

        if (conversation == null)
        {
            return NotFound(new
            {
                message = "Conversation not found."
            });
        }

        return Ok(conversation);
    }

    // =========================================================
    // GET: api/messages/conversations/{conversationId}/messages
    // Returns messages in chronological order
    // =========================================================
    [HttpGet("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var role = GetUserRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        var messages = await _messageService.GetMessagesAsync(
            conversationId,
            userId.Value,
            role,
            cancellationToken);

        if (messages == null)
        {
            return NotFound(new
            {
                message = "Conversation not found."
            });
        }

        return Ok(messages);
    }

    // =========================================================
    // POST: api/messages/conversations
    // Company creates/opens a conversation with a candidate
    // =========================================================
    [HttpPost("conversations")]
    [Authorize(Roles = "Company")]
    public async Task<IActionResult> CreateConversation(
        [FromBody] CreateConversationDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var conversation =
                await _messageService.CreateConversationAsync(
                    userId.Value,
                    dto,
                    cancellationToken);

            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = ex.Message
                });
        }
    }

    // =========================================================
    // POST: api/messages
    // Company OR Candidate sends a message
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> SendMessage(
        [FromBody] SendMessageDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var role = GetUserRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        try
        {
            var message = await _messageService.SendMessageAsync(
                userId.Value,
                role,
                dto,
                cancellationToken);

            if (message == null)
            {
                return NotFound(new
                {
                    message = "Conversation not found or access denied."
                });
            }

            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // PUT: api/messages/conversations/{conversationId}/read
    // Marks messages from the other participant as read
    // =========================================================
    [HttpPut("conversations/{conversationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var role = GetUserRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        var success = await _messageService.MarkAsReadAsync(
            conversationId,
            userId.Value,
            role,
            cancellationToken);

        if (!success)
        {
            return NotFound(new
            {
                message = "Conversation not found or access denied."
            });
        }

        return NoContent();
    }

    // =========================================================
    // GET: api/messages/unread-count
    // Returns total unread messages for current user
    // =========================================================
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var count = await _messageService.GetUnreadCountAsync(
            userId.Value,
            cancellationToken);

        return Ok(new
        {
            unreadCount = count
        });
    }

    // =========================================================
    // JWT USER ID
    // =========================================================
    private Guid? GetUserId()
    {
        var claim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (Guid.TryParse(claim, out var userId))
        {
            return userId;
        }

        return null;
    }

    // =========================================================
    // JWT ROLE
    // =========================================================
    private string? GetUserRole()
    {
        return User.FindFirstValue(
            ClaimTypes.Role);
    }
}

