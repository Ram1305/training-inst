using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz;

namespace TrainingInstituteLMS.ApiService.Controllers.Quiz
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _quizService;
        private readonly ILogger<QuizController> _logger;

        public QuizController(IQuizService quizService, ILogger<QuizController> logger)
        {
            _quizService = quizService;
            _logger = logger;
        }

        /// <summary>
        /// Submit quiz results after completion
        /// </summary>
        [HttpPost("submit")]
        [ProducesResponseType(typeof(QuizSubmissionResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<QuizSubmissionResultDto>> SubmitQuiz([FromBody] SubmitQuizRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _quizService.SubmitQuizAsync(request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Submit quiz results as a guest (from landing page LLND test)
        /// Creates user account and submits quiz in one transaction
        /// </summary>
        [HttpPost("submit-guest")]
        [ProducesResponseType(typeof(GuestQuizSubmissionResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<GuestQuizSubmissionResultDto>> SubmitGuestQuiz([FromBody] SubmitGuestQuizRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _quizService.SubmitGuestQuizAsync(request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get quiz attempt by ID
        /// </summary>
        [HttpGet("{quizAttemptId:guid}")]
        [ProducesResponseType(typeof(QuizAttemptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuizAttemptResponseDto>> GetQuizAttempt(Guid quizAttemptId)
        {
            var attempt = await _quizService.GetQuizAttemptByIdAsync(quizAttemptId);

            if (attempt == null)
            {
                return NotFound(new { message = "Quiz attempt not found" });
            }

            return Ok(attempt);
        }

        /// <summary>
        /// Get all quiz attempts with filtering
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(QuizAttemptListResponseDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<QuizAttemptListResponseDto>> GetQuizAttempts([FromQuery] GetQuizAttemptsRequestDto filter)
        {
            var result = await _quizService.GetQuizAttemptsAsync(filter);
            return Ok(result);
        }

        /// <summary>
        /// Get student's quiz status
        /// </summary>
        [HttpGet("student/{studentId:guid}/status")]
        [ProducesResponseType(typeof(StudentQuizStatusResponseDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StudentQuizStatusResponseDto>> GetStudentQuizStatus(Guid studentId)
        {
            var status = await _quizService.GetStudentQuizStatusAsync(studentId);
            return Ok(status);
        }

        /// <summary>
        /// Get student's latest quiz attempt
        /// </summary>
        [HttpGet("student/{studentId:guid}/latest")]
        [ProducesResponseType(typeof(QuizAttemptResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuizAttemptResponseDto>> GetLatestQuizAttempt(Guid studentId)
        {
            var attempt = await _quizService.GetLatestQuizAttemptByStudentAsync(studentId);

            if (attempt == null)
            {
                return NotFound(new { message = "No quiz attempts found for this student" });
            }

            return Ok(attempt);
        }

        /// <summary>
        /// Check if student has passed the quiz
        /// </summary>
        [HttpGet("student/{studentId:guid}/has-passed")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> HasStudentPassedQuiz(Guid studentId)
        {
            var hasPassed = await _quizService.HasStudentPassedQuizAsync(studentId);
            return Ok(new { studentId, hasPassed });
        }

        /// <summary>
        /// Check if student can enroll in courses
        /// </summary>
        [HttpGet("student/{studentId:guid}/can-enroll")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> CanStudentEnroll(Guid studentId)
        {
            var canEnroll = await _quizService.CanStudentEnrollAsync(studentId);
            return Ok(new { studentId, canEnroll });
        }
    }
}
