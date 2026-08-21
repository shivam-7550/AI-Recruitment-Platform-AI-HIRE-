using Backend.Interfaces;

namespace Backend.Services
{
    public class SkillExtractor : ISkillExtractor
    {
        private readonly List<string> _skills = new()
        {
            // Programming Languages
            "C#",
            "Java",
            "Python",
            "JavaScript",
            "TypeScript",
            "C++",
            "C",

            // .NET
            ".NET",
            ".NET Core",
            "ASP.NET",
            "ASP.NET Core",
            "MVC",
            "Web API",
            "Entity Framework",
            "Entity Framework Core",
            "LINQ",

            // Frontend
            "HTML",
            "CSS",
            "Bootstrap",
            "Tailwind CSS",
            "React",
            "Angular",
            "Vue",
            "Next.js",

            // Database
            "SQL",
            "SQL Server",
            "MySQL",
            "PostgreSQL",
            "MongoDB",
            "Oracle",

            // Cloud
            "Azure",
            "AWS",
            "Google Cloud",

            // DevOps
            "Docker",
            "Kubernetes",
            "Jenkins",
            "Git",
            "GitHub",
            "GitLab",
            "CI/CD",

            // APIs
            "REST API",
            "GraphQL",

            // Messaging
            "RabbitMQ",
            "Kafka",
            "Redis",

            // Testing
            "xUnit",
            "NUnit",
            "MSTest",
            "Selenium",
            "Postman",

            // AI
            "OpenAI",
            "Machine Learning",
            "Artificial Intelligence",
            "TensorFlow",
            "PyTorch",
            "LangChain",
            "LLM",

            // Others
            "Agile",
            "Scrum",
            "Microservices",
            "OOP",
            "Design Patterns"
        };

        public List<string> ExtractSkills(string resumeText)
        {
            if (string.IsNullOrWhiteSpace(resumeText))
            {
                return new List<string>();
            }

            resumeText = resumeText.ToLower();

            var extractedSkills = new List<string>();

            foreach (var skill in _skills)
            {
                if (resumeText.Contains(skill.ToLower()))
                {
                    extractedSkills.Add(skill);
                }
            }

            return extractedSkills
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }
    }
}