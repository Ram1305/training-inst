using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Certifications;
using TrainingInstituteLMS.Data.Entities.Companies;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.Data.Entities.Exams;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Gallery;
using TrainingInstituteLMS.Data.Entities.Reviews;
using TrainingInstituteLMS.Data.Entities.Schedules;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.Data.Entities.System;

namespace TrainingInstituteLMS.Data.Data
{
    public class TrainingLMSDbContext : DbContext
    {
        public TrainingLMSDbContext(DbContextOptions<TrainingLMSDbContext> options)
            : base(options)
        {
        }

        // All DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<PreEnrollmentQuizAttempt> PreEnrollmentQuizAttempts { get; set; }
        public DbSet<QuizSectionResult> QuizSectionResults { get; set; }
        public DbSet<AdminBypass> AdminBypasses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<PaymentProof> PaymentProofs { get; set; }
        public DbSet<ScheduleType> ScheduleTypes { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<ExternalExamLink> ExternalExamLinks { get; set; }
        public DbSet<ExamResult> ExamResults { get; set; }
        public DbSet<CertificateApproval> CertificateApprovals { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        // Courses
        public DbSet<Course> Courses { get; set; }
        public DbSet<CourseCategory> CourseCategories { get; set; }
        public DbSet<CourseRule> CourseRules { get; set; }
        public DbSet<CourseDate> CourseDates { get; set; }
        public DbSet<CourseEntryRequirement> CourseEntryRequirements { get; set; }
        public DbSet<CourseTrainingOverview> CourseTrainingOverviews { get; set; }
        public DbSet<CourseVocationalOutcome> CourseVocationalOutcomes { get; set; }
        public DbSet<CoursePathway> CoursePathways { get; set; }
        public DbSet<CourseFeeCharge> CourseFeeCharges { get; set; }
        public DbSet<CourseOptionalCharge> CourseOptionalCharges { get; set; }
        public DbSet<CourseComboOffer> CourseComboOffers { get; set; }

        // Enrollment Links (for QR code based enrollment)
        public DbSet<EnrollmentLink> EnrollmentLinks { get; set; }

        // Company orders (bulk course purchase, one-time links)
        public DbSet<CompanyOrder> CompanyOrders { get; set; }

        // Google Reviews (for landing page)
        public DbSet<GoogleReview> GoogleReviews { get; set; }

        // Gallery Images
        public DbSet<GalleryImage> GalleryImages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ USE RESTRICT FOR EVERYTHING - Simple and safe!

            // User self-reference
            modelBuilder.Entity<User>()
                .HasOne(u => u.Creator)
                .WithMany()
                .HasForeignKey(u => u.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> Student
            modelBuilder.Entity<User>()
                .HasOne(u => u.Student)
                .WithOne(s => s.User)
                .HasForeignKey<Student>(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> Company
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithOne(c => c.User)
                .HasForeignKey<Company>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // AdminBypass relationships
            modelBuilder.Entity<AdminBypass>()
                .HasOne(ab => ab.Student)
                .WithMany()
                .HasForeignKey(ab => ab.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AdminBypass>()
                .HasOne(ab => ab.QuizAttempt)
                .WithOne(qa => qa.AdminBypass)
                .HasForeignKey<AdminBypass>(ab => ab.QuizAttemptId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AdminBypass>()
                .HasOne(ab => ab.Admin)
                .WithMany()
                .HasForeignKey(ab => ab.BypassedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Enrollment relationships
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.QuizAttempt)
                .WithMany()
                .HasForeignKey(e => e.QuizAttemptId)
                .OnDelete(DeleteBehavior.Restrict);

            // Enrollment -> CourseDate (RESTRICT)
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.CourseDate)
                .WithMany()
                .HasForeignKey(e => e.CourseDateId)
                .OnDelete(DeleteBehavior.Restrict);

            // PaymentProof -> Enrollment (RESTRICT instead of CASCADE)
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.PaymentProof)
                .WithOne(pp => pp.Enrollment)
                .HasForeignKey<PaymentProof>(pp => pp.EnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // PaymentProof -> Student (RESTRICT)
            modelBuilder.Entity<PaymentProof>()
                .HasOne(pp => pp.Student)
                .WithMany()
                .HasForeignKey(pp => pp.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExternalExamLink -> Enrollment (RESTRICT)
            modelBuilder.Entity<ExternalExamLink>()
                .HasOne(eel => eel.Enrollment)
                .WithOne(e => e.ExternalExamLink)
                .HasForeignKey<ExternalExamLink>(eel => eel.EnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamResult -> Enrollment (RESTRICT)
            modelBuilder.Entity<ExamResult>()
                .HasOne(er => er.Enrollment)
                .WithOne(e => e.ExamResult)
                .HasForeignKey<ExamResult>(er => er.EnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamResult -> Student (RESTRICT)
            modelBuilder.Entity<ExamResult>()
                .HasOne(er => er.Student)
                .WithMany()
                .HasForeignKey(er => er.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamResult -> Course (RESTRICT)
            modelBuilder.Entity<ExamResult>()
                .HasOne(er => er.Course)
                .WithMany()
                .HasForeignKey(er => er.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // CertificateApproval -> Enrollment (RESTRICT)
            modelBuilder.Entity<CertificateApproval>()
                .HasOne(ca => ca.Enrollment)
                .WithOne(e => e.CertificateApproval)
                .HasForeignKey<CertificateApproval>(ca => ca.EnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // CertificateApproval -> Student (RESTRICT)
            modelBuilder.Entity<CertificateApproval>()
                .HasOne(ca => ca.Student)
                .WithMany()
                .HasForeignKey(ca => ca.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // CertificateApproval -> Course (RESTRICT)
            modelBuilder.Entity<CertificateApproval>()
                .HasOne(ca => ca.Course)
                .WithMany()
                .HasForeignKey(ca => ca.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Certificate -> Enrollment (RESTRICT)
            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Enrollment)
                .WithOne(e => e.Certificate)
                .HasForeignKey<Certificate>(c => c.EnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Certificate -> Student (RESTRICT)
            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Student)
                .WithMany()
                .HasForeignKey(c => c.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Certificate -> Course (RESTRICT)
            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Course)
                .WithMany()
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Course configuration
            modelBuilder.Entity<Course>()
                .HasIndex(c => c.CourseCode)
                .IsUnique();

            // CourseCategory configuration
            modelBuilder.Entity<CourseCategory>()
                .HasIndex(c => c.CategoryName)
                .IsUnique();

            // Course to Category relationship
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Category)
                .WithMany(cat => cat.Courses)
                .HasForeignKey(c => c.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // CourseRule one-to-one relationship
            modelBuilder.Entity<Course>()
                .HasOne(c => c.CourseRule)
                .WithOne(cr => cr.Course)
                .HasForeignKey<CourseRule>(cr => cr.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // CourseComboOffer one-to-one relationship
            modelBuilder.Entity<Course>()
                .HasOne(c => c.ComboOffer)
                .WithOne(co => co.Course)
                .HasForeignKey<CourseComboOffer>(co => co.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Course related collections
            modelBuilder.Entity<CourseEntryRequirement>()
                .HasOne(er => er.Course)
                .WithMany(c => c.EntryRequirements)
                .HasForeignKey(er => er.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseTrainingOverview>()
                .HasOne(to => to.Course)
                .WithMany(c => c.TrainingOverviews)
                .HasForeignKey(to => to.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseVocationalOutcome>()
                .HasOne(vo => vo.Course)
                .WithMany(c => c.VocationalOutcomes)
                .HasForeignKey(vo => vo.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CoursePathway>()
                .HasOne(p => p.Course)
                .WithMany(c => c.Pathways)
                .HasForeignKey(p => p.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseFeeCharge>()
                .HasOne(fc => fc.Course)
                .WithMany(c => c.FeesAndCharges)
                .HasForeignKey(fc => fc.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseOptionalCharge>()
                .HasOne(oc => oc.Course)
                .WithMany(c => c.OptionalCharges)
                .HasForeignKey(oc => oc.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            // EnrollmentLink configuration
            modelBuilder.Entity<EnrollmentLink>()
                .HasIndex(el => el.UniqueCode)
                .IsUnique();

            modelBuilder.Entity<EnrollmentLink>()
                .HasOne(el => el.Course)
                .WithMany()
                .HasForeignKey(el => el.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EnrollmentLink>()
                .HasOne(el => el.CourseDate)
                .WithMany()
                .HasForeignKey(el => el.CourseDateId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed default roles
            var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    RoleId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    RoleName = "SuperAdmin",
                    Description = "System Administrator",
                    CreatedAt = seedDate
                },
                new Role
                {
                    RoleId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    RoleName = "Admin",
                    Description = "Institute Administrator",
                    CreatedAt = seedDate
                },
                new Role
                {
                    RoleId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    RoleName = "Teacher",
                    Description = "Course Teacher",
                    CreatedAt = seedDate
                },
                new Role
                {
                    RoleId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    RoleName = "Student",
                    Description = "Enrolled Student",
                    CreatedAt = seedDate
                }
            );
        }
    }
}
