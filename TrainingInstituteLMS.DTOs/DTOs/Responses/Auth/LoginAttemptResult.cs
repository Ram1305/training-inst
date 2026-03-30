namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Auth
{
    public enum LoginFailureKind
    {
        EmailNotFound,
        WrongPassword
    }

    /// <summary>
    /// Result of a credential check: either a signed-in user or a specific failure reason.
    /// </summary>
    public sealed class LoginAttemptResult
    {
        public AuthResponseDto? User { get; private init; }
        public LoginFailureKind? Failure { get; private init; }

        public static LoginAttemptResult Success(AuthResponseDto user) =>
            new() { User = user };

        public static LoginAttemptResult Failed(LoginFailureKind kind) =>
            new() { Failure = kind };
    }
}
