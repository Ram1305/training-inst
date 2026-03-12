using System;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.VOC
{
    public class VOCSubmissionResponseDto
    {
        public Guid SubmissionId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string AustralianStudentId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public DateTime? PreferredStartDate { get; set; }
        public string? PreferredTime { get; set; }
        public string? Comments { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class VOCListResponseDto
    {
        public IEnumerable<VOCSubmissionResponseDto> Submissions { get; set; } = Enumerable.Empty<VOCSubmissionResponseDto>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class VOCStatsResponseDto
    {
        public int TotalSubmissions { get; set; }
        public int PendingSubmissions { get; set; }
        public int VerifiedSubmissions { get; set; }
        public int CompletedSubmissions { get; set; }
        public int RejectedSubmissions { get; set; }
    }
}
