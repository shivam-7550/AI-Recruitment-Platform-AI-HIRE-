using Backend.DTOs.Messages;

namespace Backend.Interfaces.Services;

public interface IMessageService
{
    Task<List<ConversationSummaryDto>> GetConversationsAsync(
        Guid userId,
        string role,
        CancellationToken cancellationToken);

    Task<ConversationDto?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken);

    Task<List<MessageDto>?> GetMessagesAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken);

    Task<ConversationDto> CreateConversationAsync(
        Guid companyUserId,
        CreateConversationDto dto,
        CancellationToken cancellationToken);

    Task<MessageDto?> SendMessageAsync(
        Guid senderUserId,
        string role,
        SendMessageDto dto,
        CancellationToken cancellationToken);

    Task<bool> MarkAsReadAsync(
        Guid conversationId,
        Guid userId,
        string role,
        CancellationToken cancellationToken);

    Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken);
}