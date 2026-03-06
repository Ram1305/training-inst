using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        /// <summary>
        /// Optional list of error details (e.g. per-field validation errors).
        /// </summary>
        public List<string>? Errors { get; set; }
        public T? Data { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static ApiResponse<T> SuccessResponse(T? data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> FailureResponse(string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default
            };
        }

        /// <summary>
        /// Failure response with optional list of errors (e.g. validation field errors).
        /// </summary>
        public static ApiResponse<T> FailureResponse(string message, IReadOnlyList<string>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors != null && errors.Count > 0 ? new List<string>(errors) : null,
                Data = default
            };
        }
    }
}
