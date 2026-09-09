using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly ApplicationDbContext _context;

    public MessageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Conversation>> GetCompanyConversationsAsync(
    Guid companyId,
    CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .AsNoTracking()
            .AsSplitQuery()
            .Where(x => x.CompanyId == companyId)
            .Include(x => x.Company)
            .Include(x => x.Candidate)
            .Include(x => x.Application)
                .ThenInclude(x => x.Job)
            .Include(x => x.Messages)
            .OrderByDescending(x =>
                x.Messages
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => (DateTime?)m.CreatedAt)
                    .FirstOrDefault()
                    ?? x.UpdatedAt
                    ?? x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Conversation>> GetCandidateConversationsAsync(
    Guid userId,
    CancellationToken cancellationToken = default)
    {
        return await _context.Conversations
            .AsNoTracking()
            .AsSplitQuery()
            .Where(x => x.CandidateId == userId)
            .Include(x => x.Company)
            .Include(x => x.Candidate)
            .Include(x => x.Application)
                .ThenInclude(x => x.Job)
            .Include(x => x.Messages)
            .OrderByDescending(x =>
                x.Messages
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => (DateTime?)m.CreatedAt)
                    .FirstOrDefault()
                    ?? x.UpdatedAt
                    ?? x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Conversation?> GetConversationByIdAsync(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .Include(x => x.Company)
            .Include(x => x.Candidate)
            .Include(x => x.Application)
                .ThenInclude(x => x.Job)
            .FirstOrDefaultAsync(
                x => x.Id == conversationId,
                cancellationToken);
    }

    public async Task<List<Message>> GetMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        return await _context.Messages
            .AsNoTracking()
            .Where(x => x.ConversationId == conversationId)
            .Include(x => x.Sender)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Conversation?> FindExistingConversationAsync(
        Guid companyId,
        Guid candidateId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .Include(x => x.Company)
            .Include(x => x.Candidate)
            .Include(x => x.Application)
                .ThenInclude(x => x.Job)
            .FirstOrDefaultAsync(
                x =>
                    x.CompanyId == companyId &&
                    x.CandidateId == candidateId &&
                    x.ApplicationId == applicationId,
                cancellationToken);
    }

    public async Task AddConversationAsync(
        Conversation conversation,
        CancellationToken cancellationToken)
    {
        await _context.Conversations.AddAsync(
            conversation,
            cancellationToken);
    }

    public async Task AddMessageAsync(
        Message message,
        CancellationToken cancellationToken)
    {
        await _context.Messages.AddAsync(
            message,
            cancellationToken);
    }

    public async Task<int> MarkMessagesAsReadAsync(
        Guid conversationId,
        Guid readerUserId,
        CancellationToken cancellationToken)
    {
        var messages = await _context.Messages
            .Where(x =>
                x.ConversationId == conversationId &&
                x.SenderId != readerUserId &&
                !x.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.UpdatedAt = DateTime.UtcNow;
        }

        return messages.Count;
    }

    public async Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .Where(x =>
                x.CandidateId == userId ||
                x.Company.UserId == userId)
            .SelectMany(x => x.Messages)
            .CountAsync(
                x =>
                    x.SenderId != userId &&
                    !x.IsRead,
                cancellationToken);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}