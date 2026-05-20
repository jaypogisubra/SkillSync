// Curated dictionary of skills across different categories
export const SKILL_DICTIONARY = [
  // Frontend
  "React", "Vue", "Angular", "JavaScript", "TypeScript", "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Next.js", "Redux", "Webpack",
  // Backend & Databases
  "Node.js", "Express", "Python", "Django", "Flask", "Ruby", "Ruby on Rails", "Java", "Spring Boot", "C#", ".NET", "PHP", "Laravel", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "Firebase",
  // DevOps & Cloud
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Jenkins", "Linux", "Nginx",
  // Professional & Other
  "Figma", "UI/UX Design", "Product Management", "Project Management", "Agile", "Scrum", "Jira", "Excel", "Data Analysis", "Machine Learning", "AI", "SEO", "Sales", "Marketing", "Communication", "Leadership"
];

/**
 * Client-side resume parsing and skill detection.
 * Reads the text content of a file (if possible) or uses the file metadata
 * to automatically extract skills, calculate formatting/quality scores, and structure details.
 */
export async function parseResumeFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = (e.target?.result || "").toString();
      const detectedSkills = [];
      const lowerText = text.toLowerCase() + " " + file.name.toLowerCase();

      // 1. Detect Skills
      SKILL_DICTIONARY.forEach((skill) => {
        const skillLower = skill.toLowerCase();
        // Check word boundaries or simple inclusion for compound words
        const regex = new RegExp(`\\b${skillLower.replace(".", "\\.")}\\b`, "i");
        if (regex.test(lowerText) || lowerText.includes(` ${skillLower} `) || lowerText.includes(skillLower)) {
          if (!detectedSkills.includes(skill)) {
            detectedSkills.push(skill);
          }
        }
      });

      // 2. Extract Basic Details (Email, Phone, Links)
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
      const phoneRegex = /(\+?\d{1,4}[-.\s]??)?\(?\d{3}\)?[-.\s]??\d{3}[-.\s]??\d{4}/;
      const linkedinRegex = /linkedin\.com\/in\/[\w.-]+/i;
      const githubRegex = /github\.com\/[\w.-]+/i;

      const emailMatch = text.match(emailRegex);
      const phoneMatch = text.match(phoneRegex);
      const linkedinMatch = text.match(linkedinRegex);
      const githubMatch = text.match(githubRegex);

      const parsedDetails = {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedinMatch ? "https://" + linkedinMatch[0] : null,
        github: githubMatch ? "https://" + githubMatch[0] : null,
        hasExperienceSection: /experience|work history|employment|jobs/i.test(text),
        hasEducationSection: /education|university|college|degree|academic/i.test(text),
        hasCertificationsSection: /certifications|certificates|courses/i.test(text)
      };

      // 3. Compute Resume Quality Score (out of 100)
      let score = 20; // Base score for uploading

      // File Format Bonus
      if (file.name.toLowerCase().endsWith(".pdf")) {
        score += 10; // PDF is preferred
      } else {
        score += 5; // DOCX/DOC is okay
      }

      // Contact Information Bonus
      if (parsedDetails.email) score += 10;
      if (parsedDetails.phone) score += 10;
      if (parsedDetails.linkedin || parsedDetails.github) score += 5;

      // Section Structure Bonus
      if (parsedDetails.hasExperienceSection) score += 15;
      if (parsedDetails.hasEducationSection) score += 15;
      if (parsedDetails.hasCertificationsSection) score += 10;

      // Skill Keyword Match Bonus
      const skillCount = detectedSkills.length;
      if (skillCount > 8) score += 15;
      else if (skillCount > 4) score += 10;
      else if (skillCount > 1) score += 5;

      score = Math.min(100, score);

      // 4. Compute Completeness Percentage
      let completeness = 20;
      if (parsedDetails.email || parsedDetails.phone) completeness += 20;
      if (detectedSkills.length > 0) completeness += 20;
      if (parsedDetails.hasExperienceSection) completeness += 20;
      if (parsedDetails.hasEducationSection) completeness += 20;

      resolve({
        score: Math.round(score),
        completeness: Math.round(completeness),
        skills: detectedSkills,
        details: parsedDetails
      });
    };

    reader.onerror = () => {
      // Fallback on read error: use file name matching
      const detectedSkills = [];
      const lowerName = file.name.toLowerCase();

      SKILL_DICTIONARY.forEach((skill) => {
        if (lowerName.includes(skill.toLowerCase())) {
          detectedSkills.push(skill);
        }
      });

      resolve({
        score: 40,
        completeness: 30,
        skills: detectedSkills,
        details: {}
      });
    };

    // If it's a small binary/text, read first 50KB to scan details
    // (PDFs contain binary stream but text keywords are often readable as ASCII)
    const blob = file.slice(0, 50000);
    reader.readAsText(blob, "UTF-8");
  });
}
