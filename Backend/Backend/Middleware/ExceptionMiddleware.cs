using System.Net;
using System.Text.Json;

namespace Backend.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try     
            {
                await _next(context);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);

                await HandleExceptionAsync(context, exception);
            }
        }

        private static async Task HandleExceptionAsync(
            HttpContext context,
            Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse
            {
                Success = false
            };

            switch (exception)
            {
                case UnauthorizedAccessException:
                    context.Response.StatusCode =
                        (int)HttpStatusCode.Unauthorized;

                    response.Message = "Unauthorized access.";
                    break;

                case KeyNotFoundException:
                    context.Response.StatusCode =
                        (int)HttpStatusCode.NotFound;

                    response.Message = exception.Message;
                    break;

                case ArgumentException:
                    context.Response.StatusCode =
                        (int)HttpStatusCode.BadRequest;

                    response.Message = exception.Message;
                    break;

                case InvalidOperationException:
                    context.Response.StatusCode =
                        (int)HttpStatusCode.BadRequest;

                    response.Message = exception.Message;
                    break;

                default:
                    context.Response.StatusCode =
                        (int)HttpStatusCode.InternalServerError;

                    response.Message =
                        "An unexpected error occurred. Please try again later.";
                    break;
            }

            var json = JsonSerializer.Serialize(response);

            await context.Response.WriteAsync(json);
        }

        private class ErrorResponse
        {
            public bool Success { get; set; }

            public string Message { get; set; } = string.Empty;
        }
    }
}