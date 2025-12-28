const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema({
  // ============ CORE IDENTITY ============
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  
  // ============ PERSONAL INFO ============
  personalInfo: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    location: {
      city: String,
      state: String,
      country: String,
      timezone: String
    },
    linkedIn: String,
    github: String,
    portfolio: String
  },

  // ============ CAREER LEVEL ============
  careerLevel: {
    type: String,
    enum: [
      "student",
      "fresh_graduate", 
      "entry_level",      // 0-1 years
      "mid_level",        // 2-4 years
      "senior",           // 5-8 years
      "lead",             // 8-12 years
      "principal",        // 12+ years
      "executive"
    ],
    default: "fresh_graduate"
  },
  totalYearsOfExperience: { type: Number, default: 0 },
  
  // ============ PROFESSIONAL EXPERIENCE ============
  experience: [{
    company: { type: String, required: true },
    companyType: {
      type: String,
      enum: ["startup", "mid_size", "enterprise", "faang", "consulting", "freelance"]
    },
    role: { type: String, required: true },
    level: {
      type: String,
      enum: ["intern", "junior", "mid", "senior", "lead", "manager", "director", "vp", "cto"]
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "freelance"]
    },
    domain: String,  // E-commerce, Healthcare, Fintech, etc.
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    location: String,
    description: String,
    achievements: [String],
    technologies: [String],
    teamSize: Number,
    responsibilities: [String]
  }],

  // ============ EDUCATION ============
  education: [{
    institution: { type: String, required: true },
    degree: {
      type: String,
      enum: ["high_school", "associate", "bachelor", "master", "phd", "bootcamp", "certification"]
    },
    field: String,  // Computer Science, Data Science, etc.
    gpa: Number,
    startDate: Date,
    endDate: Date,
    isCompleted: { type: Boolean, default: true },
    achievements: [String],
    relevantCoursework: [String]
  }],

  // ============ TECHNICAL SKILLS ============
  skills: {
    languages: [{
      name: String,
      proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
      yearsOfExperience: Number
    }],
    frameworks: [{
      name: String,
      proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
      yearsOfExperience: Number
    }],
    databases: [{
      name: String,
      proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] }
    }],
    cloud: [{
      name: String,  // AWS, GCP, Azure
      services: [String],  // EC2, S3, Lambda, etc.
      proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] }
    }],
    tools: [{
      name: String,
      category: String  // Version Control, CI/CD, Testing, etc.
    }],
    concepts: [String]  // System Design, Microservices, REST, GraphQL, etc.
  },

  // ============ PROJECTS ============
  projects: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["professional", "personal", "academic", "open_source", "hackathon"]
    },
    description: String,
    role: String,
    technologies: [String],
    achievements: [String],
    metrics: {
      users: Number,
      performance: String,
      impact: String
    },
    links: {
      live: String,
      github: String,
      demo: String
    },
    startDate: Date,
    endDate: Date
  }],

  // ============ CERTIFICATIONS ============
  certifications: [{
    name: String,
    issuer: String,  // AWS, Google, Microsoft, etc.
    dateObtained: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],

  // ============ AI ANALYSIS ============
  careerDNA: {
    // Strength Analysis
    strongAreas: [{
      area: String,
      confidence: { type: Number, min: 0, max: 100 },
      evidence: [String]  // Why AI thinks this is strong
    }],
    
    // Improvement Areas
    weakAreas: [{
      area: String,
      priority: { type: String, enum: ["low", "medium", "high", "critical"] },
      recommendations: [String]
    }],
    
    // Career Insights
    careerPath: {
      currentLevel: String,
      targetRoles: [String],
      readinessScore: { type: Number, min: 0, max: 100 },
      gapAnalysis: [{
        skill: String,
        currentLevel: String,
        requiredLevel: String,
        action: String
      }]
    },
    
    // Interview Readiness
    interviewReadiness: {
      technical: { type: Number, min: 0, max: 100, default: 0 },
      behavioral: { type: Number, min: 0, max: 100, default: 0 },
      systemDesign: { type: Number, min: 0, max: 100, default: 0 },
      communication: { type: Number, min: 0, max: 100, default: 0 },
      overall: { type: Number, min: 0, max: 100, default: 0 }
    },
    
    // Recommended Focus
    recommendedTopics: [{
      topic: String,
      reason: String,
      priority: { type: Number, min: 1, max: 5 }
    }],
    
    // Last analyzed
    lastAnalyzed: Date
  },

  // ============ INTERVIEW HISTORY ============
  interviewHistory: [{
    sessionId: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["technical", "behavioral", "system_design", "coding", "hr", "mixed"]
    },
    topic: String,
    difficulty: { type: String, enum: ["easy", "medium", "hard", "expert"] },
    duration: Number,  // in minutes
    
    // Scores
    scores: {
      technical: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      problemSolving: { type: Number, min: 0, max: 100 },
      overall: { type: Number, min: 0, max: 100 }
    },
    
    // Questions & Answers
    questionsAsked: [{
      question: String,
      userAnswer: String,
      idealAnswer: String,
      score: Number,
      feedback: String
    }],
    
    // AI Feedback
    feedback: {
      strengths: [String],
      improvements: [String],
      summary: String
    },
    
    // Company-specific prep
    targetCompany: String
  }],

  // ============ GOALS & PREFERENCES ============
  goals: {
    targetRoles: [String],
    targetCompanies: [String],
    targetSalary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "USD" }
    },
    preferredLocations: [String],
    remotePreference: {
      type: String,
      enum: ["remote", "hybrid", "onsite", "flexible"]
    },
    timeline: {
      type: String,
      enum: ["immediately", "1_month", "3_months", "6_months", "exploring"]
    },
    priorities: [String]  // Work-life balance, Growth, Salary, etc.
  },

  // ============ PREFERENCES ============
  preferences: {
    interviewStyle: {
      type: String,
      enum: ["encouraging", "challenging", "realistic", "mixed"],
      default: "realistic"
    },
    difficultyLevel: {
      type: String,
      enum: ["adaptive", "easy", "medium", "hard"],
      default: "adaptive"
    },
    feedbackDetail: {
      type: String,
      enum: ["brief", "detailed", "comprehensive"],
      default: "detailed"
    },
    focusAreas: [String],
    avoidTopics: [String]
  },

  // ============ ENGAGEMENT METRICS ============
  engagement: {
    totalSessions: { type: Number, default: 0 },
    totalPracticeTime: { type: Number, default: 0 },  // in minutes
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastPracticeDate: Date
    },
    achievements: [{
      name: String,
      description: String,
      dateEarned: Date,
      icon: String
    }]
  },

  // ============ RESUME DATA ============
  resumeData: {
    rawText: String,
    fileName: String,
    uploadedAt: Date,
    parsedAt: Date,
    version: { type: Number, default: 1 }
  },

  // ============ METADATA ============
  metadata: {
    profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },
    lastActive: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ["manual", "resume_upload", "linkedin_import"],
      default: "manual"
    }
  }
}, {
  timestamps: true
});

// ============ INDEXES ============
UserProfileSchema.index({ "personalInfo.email": 1 });
UserProfileSchema.index({ "skills.languages.name": 1 });
UserProfileSchema.index({ "experience.company": 1 });
UserProfileSchema.index({ "careerLevel": 1 });

// ============ METHODS ============

// Calculate profile completeness
UserProfileSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const weights = {
    personalInfo: 10,
    experience: 25,
    education: 15,
    skills: 25,
    projects: 15,
    goals: 10
  };
  
  if (this.personalInfo?.firstName) score += weights.personalInfo;
  if (this.experience?.length > 0) score += weights.experience;
  if (this.education?.length > 0) score += weights.education;
  if (this.skills?.languages?.length > 0) score += weights.skills;
  if (this.projects?.length > 0) score += weights.projects;
  if (this.goals?.targetRoles?.length > 0) score += weights.goals;
  
  this.metadata.profileCompleteness = score;
  return score;
};

// Get personalized interview topics
UserProfileSchema.methods.getRecommendedTopics = function() {
  const topics = [];
  
  // Based on skills
  this.skills?.languages?.forEach(lang => {
    if (lang.proficiency === "advanced" || lang.proficiency === "expert") {
      topics.push({ topic: lang.name, reason: "Your strong skill", priority: 2 });
    }
  });
  
  // Based on weak areas
  this.careerDNA?.weakAreas?.forEach(weak => {
    topics.push({ topic: weak.area, reason: "Needs improvement", priority: 1 });
  });
  
  // Based on target roles
  if (this.goals?.targetRoles?.includes("Senior Developer")) {
    topics.push({ topic: "System Design", reason: "Required for senior roles", priority: 1 });
  }
  
  return topics.sort((a, b) => a.priority - b.priority);
};

// Get interview context for AI
UserProfileSchema.methods.getInterviewContext = function() {
  return {
    level: this.careerLevel,
    yearsExp: this.totalYearsOfExperience,
    skills: this.skills?.languages?.map(l => l.name) || [],
    recentCompany: this.experience?.[0]?.company || null,
    recentRole: this.experience?.[0]?.role || null,
    domain: this.experience?.[0]?.domain || null,
    education: this.education?.[0]?.degree || null,
    strongAreas: this.careerDNA?.strongAreas?.map(s => s.area) || [],
    weakAreas: this.careerDNA?.weakAreas?.map(w => w.area) || [],
    targetRole: this.goals?.targetRoles?.[0] || null,
    interviewReadiness: this.careerDNA?.interviewReadiness || {}
  };
};

module.exports = mongoose.model("UserProfile", UserProfileSchema);