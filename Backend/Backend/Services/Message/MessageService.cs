using Backend.Data;
using Backend.DTOs.Messages;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services;
public class MessageService : IMessageService
{
    private readonly IMessageRepository _messageRepository;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;
    public MessageService(
        IMessageRepository messageRepository,
        INotificationService notificationService,
        ApplicationDbContext context)
    {
        _messageRepository = messageRepository;
        _notificationService = notificationService;
        _context = context;
    }
    // =========================================================
    // GET CONVERSATIONS
    // =========================================================
    public async Task<List<ConversationSummaryDto>> GetConversationsAsync(
        Guid userId,
        string role,
        CancellationToken cancellationToken)
    {
        List<Conversation> conversations;
        if (role.Equals("Company", StringComparison.OrdinalIgnoreCase))
        {
            var company = await _context.Companies
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);
            if (company == null)
            {
                return new List<ConversationSummaryDto>();
            }
            return await _messageRepository
                .GetCompanyConversationsAsync(
                    company.Id,
                    userId,
                    cancellationToken);
        }
        else if (role.Equals("User", StringComparison.OrdinalIgnoreCase))
        {
            conversations = await _messageRepository
                .GetCandidateConversationsAsync(
                    userId,
                    cancellationToken);
        }
        else
        {
            return new List<ConversationSummaryDto>();
        }
        return conversations.Select(x =>
        {
            var lastMessage = x.Messages
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();
            var unreadCount = x.Messages.Count(m =>
                !m.IsRead &&
                m.SenderId != userId);
            return new ConversationSummaryDto
            {
                ConversationId = x.Id,
                CandidateId = x.CandidateId,
                CandidateName = x.Candidate?.Name ?? string.Empty,
                CandidateProfileImage = null, //x.Candidate?.Profile?.ProfileImageUrl
                ApplicationId = x.ApplicationId,
                JobTitle = x.Application?.Job?.Title ?? string.Empty,
                ApplicationStatus = x.Application?.Status.ToString() ?? string.Empty,
                LastMessage = lastMessage?.Content,
                LastMessageAt = lastMessage?.CreatedAt,
                UnreadCount = unreadCount,
                IsArchived = x.IsArchived
            };
        }).ToList();
    }
    // =========================================================
    // GET CONVERSATION
    // =========================================================
    public async Task<ConversationDto?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken)
    {
        var conversation = await _messageRepository
            .GetConversationByIdAsync(
                conversationId,
                cancellationToken);
        if (conversation == null)
        {
            return null;
        }
        var authorized = await IsAuthorizedAsync(
            conversation,
            userId,
            role,
            cancellationToken);
        if (!authorized)
        {
            return null;
        }
        return MapConversation(conversation);
    }
    // =========================================================
    // GET MESSAGES
    // =========================================================
    public async Task<List<MessageDto>?> GetMessagesAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken)
    {
        var conversation = await _messageRepository
            .GetConversationByIdAsync(
                conversationId,
                cancellationToken);
        if (conversation == null)
        {
            return null;
        }
        var authorized = await IsAuthorizedAsync(
            conversation,
            userId,
            role,
            cancellationToken);
        if (!authorized)
        {
            return null;
        }
        var messages = await _messageRepository
            .GetMessagesAsync(
                conversationId,
                cancellationToken);
        return messages.Select(x => new MessageDto
        {
            Id = x.Id,
            ConversationId = x.ConversationId,
            SenderId = x.SenderId,
            SenderName = x.Sender?.Name ?? string.Empty,
            Content = x.Content,
            IsRead = x.IsRead,
            SentAt = x.CreatedAt,
            IsMine = x.SenderId == userId
        }).ToList();
    }
    // =========================================================
    // CREATE CONVERSATION
    // COMPANY ONLY
    // =========================================================
    public async Task<ConversationDto> CreateConversationAsync(
        Guid companyUserId,
        CreateConversationDto dto,
        CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.UserId == companyUserId,
                cancellationToken);
        if (company == null)
        {
            throw new UnauthorizedAccessException(
                "Company profile not found.");
        }
        var application = await _context.JobApplications
            .Include(x => x.User)
            .Include(x => x.Job)
            .FirstOrDefaultAsync(
                x => x.Id == dto.ApplicationId,
                cancellationToken);
        if (application == null)
        {
            throw new KeyNotFoundException(
                "Application not found.");
        }
        // Application must belong to the current company.
        if (application.Job.CompanyId != company.Id)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to access this application.");
        }
        // Application must belong to the selected candidate.
        if (application.UserId != dto.CandidateId)
        {
            throw new ArgumentException(
                "The selected candidate does not belong to this application.");
        }
        // Check if conversation already exists.
        var existing = await _messageRepository
            .FindExistingConversationAsync(
                company.Id,
                dto.CandidateId,
                dto.ApplicationId,
                cancellationToken);
        if (existing != null)
        {
            return MapConversation(existing);
        }
        var conversation = new Conversation
        {
            CompanyId = company.Id,
            CandidateId = dto.CandidateId,
            ApplicationId = dto.ApplicationId,
            IsArchived = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _messageRepository.AddConversationAsync(
            conversation,
            cancellationToken);
        await _messageRepository.SaveChangesAsync(
            cancellationToken);
        // Reload complete navigation properties.
        var created = await _messageRepository
            .GetConversationByIdAsync(
                conversation.Id,
                cancellationToken);
        if (created == null)
        {
            throw new InvalidOperationException(
                "Conversation could not be created.");
        }
        return MapConversation(created);
    }
    // =========================================================
    // SEND MESSAGE
    // =========================================================
    public async Task<MessageDto?> SendMessageAsync(
        Guid senderUserId,
        string role,
        SendMessageDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            throw new ArgumentException(
                "Message content is required.");
        }
        var content = dto.Content.Trim();

        if (content.Length > 5000)
        {
            throw new ArgumentException(
                "Message cannot exceed 5000 characters.");
        }
        var conversation = await _messageRepository
            .GetConversationByIdAsync(
                dto.ConversationId,
                cancellationToken);
        if (conversation == null)
        {
            return null;
        }
        var authorized = await IsAuthorizedAsync(
            conversation,
            senderUserId,
            role,
            cancellationToken);
        if (!authorized)
        {
            return null;
        }
        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = senderUserId,
            Content = content,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        await _messageRepository.AddMessageAsync(
            message,
            cancellationToken);
        conversation.UpdatedAt = DateTime.UtcNow;
        await _messageRepository.SaveChangesAsync(
            cancellationToken);
        // -----------------------------------------------------
        // Notification
        // -----------------------------------------------------
        Guid recipientUserId;
        string senderName;
        if (role.Equals(
                "Company",
                StringComparison.OrdinalIgnoreCase))
        {
            recipientUserId = conversation.CandidateId;
            senderName = conversation.Company?.CompanyName
                         ?? "Company";
        }
        else
        {
            recipientUserId = conversation.Company.UserId;
            senderName = conversation.Candidate?.Name
                         ?? "Candidate";
        }
        try
        {
            await _notificationService.NotifyNewMessageAsync(
                recipientUserId,
                senderName,
                cancellationToken);
        }
        catch
        {
            // Messaging should continue to work even if
            // notification creation fails.
        }
        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = senderName,
            Content = message.Content,
            IsRead = message.IsRead,
            SentAt = message.CreatedAt,
            IsMine = true
        };
    }
    // =========================================================
    // MARK AS READ
    // ========================================================
    public async Task<bool> MarkAsReadAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken)
    {
        var conversation = await _messageRepository
            .GetConversationByIdAsync(
                conversationId,
                cancellationToken);
        if (conversation == null)
        {
            return false;
        }
        var authorized = await IsAuthorizedAsync(
            conversation,
            userId,
            role,
            cancellationToken);
        if (!authorized)
        {
            return false;
        }
        await _messageRepository.MarkMessagesAsReadAsync(
            conversationId,
            userId,
            cancellationToken);
        await _messageRepository.SaveChangesAsync(
            cancellationToken);
        return true;
    }
    // =========================================================
    // UNREAD COUNT
    // =========================================================
    public async Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _messageRepository
            .GetUnreadCountAsync(
                userId,
                cancellationToken);
    }
    // =========================================================
    // AUTHORIZATION
    // =========================================================
    private async Task<bool> IsAuthorizedAsync(
        Conversation conversation,
        Guid userId,
        string role,
        CancellationToken cancellationToken)
    {
        if (role.Equals(
                "User",
                StringComparison.OrdinalIgnoreCase))
        {
            return conversation.CandidateId == userId;
        }
        if (role.Equals(
                "Company",
                StringComparison.OrdinalIgnoreCase))
        {
            var company = await _context.Companies
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.Id == conversation.CompanyId,
                    cancellationToken);
            return company != null &&
                   company.UserId == userId;
        }
        return false;
    }
    // =========================================================
    // MAPPER
    // =========================================================
    private static ConversationDto MapConversation(
        Conversation conversation)
    {
        return new ConversationDto
        {
            ConversationId = conversation.Id,
            CompanyId = conversation.CompanyId,
            CandidateId = conversation.CandidateId,
            CandidateName = conversation.Candidate?.Name
                            ?? string.Empty,
            ApplicationId = conversation.ApplicationId,
            JobTitle = conversation.Application?.Job?.Title
                       ?? string.Empty,
            ApplicationStatus = conversation.Application?.Status
                                .ToString()
                                ?? string.Empty,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            IsArchived = conversation.IsArchived
        };
    }
}
