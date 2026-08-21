using Microsoft.AspNetCore.Http;

namespace Backend.Helpers
{
    public static class FileHelper
    {
        private static readonly string[] ResumeExtensions =
        {
            ".pdf",
            ".doc",
            ".docx"
        };

        private static readonly string[] ImageExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        public static async Task<string> SaveResumeAsync(
            IFormFile file,
            IWebHostEnvironment environment)
        {
            ValidateResume(file);

            var folder = Path.Combine(
                environment.WebRootPath,
                "resumes");

            Directory.CreateDirectory(folder);

            var fileName =
                $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var filePath = Path.Combine(folder, fileName);

            using var stream = new FileStream(
                filePath,
                FileMode.Create);

            await file.CopyToAsync(stream);

            return $"/resumes/{fileName}";
        }

        public static async Task<string> SaveProfileImageAsync(
            IFormFile file,
            IWebHostEnvironment environment)
        {
            ValidateImage(file);

            var folder = Path.Combine(
                environment.WebRootPath,
                "profile-images");

            Directory.CreateDirectory(folder);

            var fileName =
                $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var filePath = Path.Combine(folder, fileName);

            using var stream = new FileStream(
                filePath,
                FileMode.Create);

            await file.CopyToAsync(stream);

            return $"/profile-images/{fileName}";
        }

        public static void DeleteFile(
            string? relativePath,
            IWebHostEnvironment environment)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            var fullPath = Path.Combine(
                environment.WebRootPath,
                relativePath.TrimStart('/'));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private static void ValidateResume(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Resume file is required.");

            if (file.Length > 10 * 1024 * 1024)
                throw new ArgumentException("Resume size cannot exceed 10 MB.");

            var extension =
                Path.GetExtension(file.FileName).ToLower();

            if (!ResumeExtensions.Contains(extension))
                throw new ArgumentException(
                    "Only PDF, DOC and DOCX files are allowed.");
        }

        private static void ValidateImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Image file is required.");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("Image size cannot exceed 5 MB.");

            var extension =
                Path.GetExtension(file.FileName).ToLower();

            if (!ImageExtensions.Contains(extension))
                throw new ArgumentException(
                    "Only JPG, JPEG, PNG and WEBP images are allowed.");
        }
    }
}