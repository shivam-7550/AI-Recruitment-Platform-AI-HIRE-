//using Backend.DTOs.Resume;
//using Backend.Interfaces.Services;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using System.Security.Claims;

//namespace Backend.Controllers.Candidate;

//[ApiController]
//[Route("api/[controller]")]
//[Authorize(Roles = "User")]
//public sealed class ResumeController : ControllerBase
//{
//    private readonly IResumeService _resumeService;

//    public ResumeController(
//        IResumeService resumeService)
//    {
//        _resumeService = resumeService;
//    }


//    // =====================================================
//    // Upload Resume
//    // =====================================================

//    [HttpPost("upload")]
//    public async Task<IActionResult> UploadResume(
//        [FromForm] UploadResumeDto dto,
//        CancellationToken cancellationToken)
//    {
//        var userId =
//            GetUserId();

//        if (userId == null)
//            return Unauthorized();

//        try
//        {
//            var result =
//                await _resumeService
//                    .UploadResumeAsync(
//                        userId.Value,
//                        dto,
//                        cancellationToken);

//            return Ok(result);
//        }
//        catch (ArgumentException ex)
//        {
//            return BadRequest(
//                new
//                {
//                    message = ex.Message
//                });
//        }
//    }


//    // =====================================================
//    // Get Resume
//    // =====================================================

//    [HttpGet]
//    public async Task<IActionResult> GetResume(
//        CancellationToken cancellationToken)
//    {
//        var userId =
//            GetUserId();

//        if (userId == null)
//            return Unauthorized();

//        var result =
//            await _resumeService
//                .GetResumeAsync(
//                    userId.Value,
//                    cancellationToken);

//        if (result == null)
//        {
//            return NotFound(
//                "Resume not found.");
//        }

//        return Ok(result);
//    }


//    // =====================================================
//    // Analyze Resume
//    // =====================================================

//    [HttpGet("{resumeId:guid}/analysis")]
//    public async Task<IActionResult> AnalyzeResume(
//        Guid resumeId,
//        CancellationToken cancellationToken)
//    {
//        var userId =
//            GetUserId();

//        if (userId == null)
//            return Unauthorized();

//        try
//        {
//            var result =
//                await _resumeService
//                    .AnalyzeResumeAsync(
//                        userId.Value,
//                        resumeId,
//                        cancellationToken);

//            return Ok(result);
//        }
//        catch (KeyNotFoundException ex)
//        {
//            return NotFound(new
//            {
//                message = ex.Message
//            });
//        }
//    }


//    // =====================================================
//    // Delete Resume
//    // =====================================================

//    [HttpDelete]
//    public async Task<IActionResult> DeleteResume(
//        CancellationToken cancellationToken)
//    {
//        var userId =
//            GetUserId();

//        if (userId == null)
//            return Unauthorized();

//        var deleted =
//            await _resumeService
//                .DeleteResumeAsync(
//                    userId.Value,
//                    cancellationToken);

//        if (!deleted)
//        {
//            return NotFound(
//                "Resume not found.");
//        }

//        return Ok(
//            new
//            {
//                message =
//                    "Resume deleted successfully."
//            });
//    }


//    // =====================================================
//    // Current User ID
//    // =====================================================

//    private Guid? GetUserId()
//    {
//        var claim =
//            User.FindFirstValue(
//                ClaimTypes.NameIdentifier);

//        return Guid.TryParse(
//            claim,
//            out var userId)
//            ? userId
//            : null;
//    }
//}




using Backend.DTOs.Resume;
using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public sealed class ResumeController : ControllerBase
{
    private readonly IResumeService _resumeService;
    private readonly IResumeAIService _resumeAIService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public ResumeController(
        IResumeService resumeService,
        IResumeAIService resumeAIService)
    {
        _resumeService = resumeService;
        _resumeAIService = resumeAIService;
    }

    // =====================================================
    // AI TEST
    // =====================================================
    // Temporary protected endpoint for testing Gemini.
    // This endpoint should NOT be anonymous.
    // =====================================================

    [HttpGet("test-ai")]
    public async Task<IActionResult> TestAI(
        CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _resumeAIService
                    .AnalyzeResumeAsync(
                        """
                        I have 3 years of experience in ASP.NET Core,
                        SQL Server, C#, REST APIs and Entity Framework.
                        I have worked on backend API development
                        and database-driven applications.
                        """,
                        "ASP.NET Core,C#,SQL Server,REST API,Entity Framework",
                        cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(
                StatusCodes.Status499ClientClosedRequest,
                new
                {
                    message = "The AI request was cancelled."
                });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    message = ex.Message
                });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An error occurred while testing the AI service.",
                    detail = ex.Message
                });
        }
    }

    // =====================================================
    // UPLOAD RESUME
    // =====================================================

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadResume(
        [FromForm] UploadResumeDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "User authentication is required."
            });
        }

        try
        {
            var result =
                await _resumeService
                    .UploadResumeAsync(
                        userId.Value,
                        dto,
                        cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(
                StatusCodes.Status499ClientClosedRequest,
                new
                {
                    message = "Resume upload was cancelled."
                });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An error occurred while uploading the resume.",
                    detail = ex.Message
                });
        }
    }

    // =====================================================
    // GET CURRENT USER RESUME
    // =====================================================

    [HttpGet]
    public async Task<IActionResult> GetResume(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "User authentication is required."
            });
        }

        try
        {
            var result =
                await _resumeService
                    .GetResumeAsync(
                        userId.Value,
                        cancellationToken);

            if (result == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            return Ok(result);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(
                StatusCodes.Status499ClientClosedRequest,
                new
                {
                    message = "Request was cancelled."
                });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An error occurred while retrieving the resume.",
                    detail = ex.Message
                });
        }
    }

    // =====================================================
    // ANALYZE CURRENT USER RESUME
    // =====================================================

    [HttpGet("{resumeId:guid}/analysis")]
    public async Task<IActionResult> AnalyzeResume(
        Guid resumeId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "User authentication is required."
            });
        }

        try
        {
            var result =
                await _resumeService
                    .AnalyzeResumeAsync(
                        userId.Value,
                        resumeId,
                        cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    message = ex.Message
                });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(
                StatusCodes.Status499ClientClosedRequest,
                new
                {
                    message = "Resume analysis was cancelled."
                });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An error occurred while analyzing the resume.",
                    detail = ex.Message
                });
        }
    }

    // =====================================================
    // DELETE RESUME
    // =====================================================

    [HttpDelete]
    public async Task<IActionResult> DeleteResume(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "User authentication is required."
            });
        }

        try
        {
            var deleted =
                await _resumeService
                    .DeleteResumeAsync(
                        userId.Value,
                        cancellationToken);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            return Ok(new
            {
                message = "Resume deleted successfully."
            });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(
                StatusCodes.Status499ClientClosedRequest,
                new
                {
                    message = "Resume deletion was cancelled."
                });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "An error occurred while deleting the resume.",
                    detail = ex.Message
                });
        }
    }

    // =====================================================
    // CURRENT USER ID
    // =====================================================

    private Guid? GetUserId()
    {
        var claim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        return Guid.TryParse(
            claim,
            out var userId)
            ? userId
            : null;
    }
}


