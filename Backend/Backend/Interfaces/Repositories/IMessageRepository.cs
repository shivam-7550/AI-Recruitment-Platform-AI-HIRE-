using Backend.Models;

namespace Backend.Interfaces.Repositories;

public interface IMessageRepository
{
    Task<List<Conversation>> GetCompanyConversationsAsync(
        Guid companyId,
        CancellationToken cancellationToken);

    Task<List<Conversation>> GetCandidateConversationsAsync(
        Guid candidateId,
        CancellationToken cancellationToken);

    Task<Conversation?> GetConversationByIdAsync(
        Guid conversationId,
        CancellationToken cancellationToken);

    Task<List<Message>> GetMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken);

    Task<Conversation?> FindExistingConversationAsync(
        Guid companyId,
        Guid candidateId,
        Guid applicationId,
        CancellationToken cancellationToken);

    Task AddConversationAsync(
        Conversation conversation,
        CancellationToken cancellationToken);

    Task AddMessageAsync(
        Message message,
        CancellationToken cancellationToken);

    Task<int> MarkMessagesAsReadAsync(
        Guid conversationId,
        Guid readerUserId,
        CancellationToken cancellationToken);

    Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}