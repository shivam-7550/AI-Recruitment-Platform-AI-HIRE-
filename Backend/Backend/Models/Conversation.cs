using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Conversation : BaseEntity
{
    public Guid CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company Company { get; set; } = null!;

    public Guid CandidateId { get; set; }

    [ForeignKey(nameof(CandidateId))]
    public User Candidate { get; set; } = null!;

    public Guid ApplicationId { get; set; }

    [ForeignKey(nameof(ApplicationId))]
    public JobApplication Application { get; set; } = null!;

    public bool IsArchived { get; set; }

    public ICollection<Message> Messages { get; set; }
        = new List<Message>();
}