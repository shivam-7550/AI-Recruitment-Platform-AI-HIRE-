using Backend.Interfaces.Utilities;
using UglyToad.PdfPig;

namespace Backend.Services
{
    public class PdfParser : IPdfParser
    {
        public string ExtractText(string filePath)
        {
            if (!File.Exists(filePath))
            {
                return string.Empty;
            }

            using var document = PdfDocument.Open(filePath);

            var text = "";

            foreach (var page in document.GetPages())
            {
                text += page.Text + Environment.NewLine;
            }

            return text.Trim();
        }
    }
}
