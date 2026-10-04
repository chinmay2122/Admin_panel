import { CorMember, CorOpportunity, CorRequest } from "../types";

export interface MatchScoreReason {
  category: "skills" | "role" | "location" | "workplace" | "experience";
  title: string;
  detail: string;
  matched: boolean;
  scoreContribution: number;
}

export interface MemberMatchResult {
  member: CorMember;
  scorePercentage: number;
  matchedSkillsCount: number;
  totalRequiredSkills: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: MatchScoreReason[];
}

export interface OpportunityMatchResult {
  opportunity: CorOpportunity;
  scorePercentage: number;
  matchedSkillsCount: number;
  totalRequiredSkills: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: MatchScoreReason[];
}

/**
 * Normalizes text for comparison
 */
function normalize(str?: string | null): string {
  return (str || "").toLowerCase().trim();
}

/**
 * Transparent rule-based match calculation between a member profile and an opportunity
 */
export function calculateMatch(member: CorMember, opportunity: CorOpportunity): {
  scorePercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: MatchScoreReason[];
} {
  const reasons: MatchScoreReason[] = [];
  let totalScore = 0;

  // 1. SKILLS MATCH (Up to 50 points)
  const memberSkills = (member.skills || []).map(normalize);
  const oppSkills = (opportunity.requiredSkills || []).map(normalize);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of opportunity.requiredSkills) {
    const norm = normalize(skill);
    const hasSkill = memberSkills.some((s) => s.includes(norm) || norm.includes(s));
    if (hasSkill) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillWeight = 50;
  let skillScore = 0;
  if (oppSkills.length > 0) {
    const ratio = matchedSkills.length / oppSkills.length;
    skillScore = Math.round(ratio * skillWeight);
    reasons.push({
      category: "skills",
      title: `Skill match: ${matchedSkills.length}/${oppSkills.length}`,
      detail:
        matchedSkills.length > 0
          ? `Matched: ${matchedSkills.join(", ")}`
          : "No required skills directly match.",
      matched: matchedSkills.length > 0,
      scoreContribution: skillScore,
    });
  } else {
    skillScore = skillWeight;
    reasons.push({
      category: "skills",
      title: "No specific skill restrictions",
      detail: "Opportunity is open to wide multidisciplinary creative backgrounds.",
      matched: true,
      scoreContribution: skillWeight,
    });
  }
  totalScore += skillScore;

  // 2. ROLE MATCH (Up to 25 points)
  const memberRole = normalize(member.desiredRole);
  const oppTitle = normalize(opportunity.title);
  let roleScore = 0;
  let roleMatched = false;

  const roleKeywords = oppTitle.split(/[\s—\-\/]+/).filter((k) => k.length > 2);
  const roleOverlap = roleKeywords.some((k) => memberRole.includes(k));

  if (memberRole && (oppTitle.includes(memberRole) || memberRole.includes(oppTitle) || roleOverlap)) {
    roleScore = 25;
    roleMatched = true;
    reasons.push({
      category: "role",
      title: "Role aligns with desired role",
      detail: `Candidate targets "${member.desiredRole || "Role"}", matching "${opportunity.title}".`,
      matched: true,
      scoreContribution: 25,
    });
  } else {
    reasons.push({
      category: "role",
      title: "Role variance",
      detail: `Desired role "${member.desiredRole || "General"}" differs slightly from "${opportunity.title}".`,
      matched: false,
      scoreContribution: 0,
    });
  }
  totalScore += roleScore;

  // 3. WORKPLACE MATCH (Up to 15 points)
  let workplaceScore = 0;
  const memberWp = normalize(member.preferredWorkType);
  const oppWp = normalize(opportunity.workplaceType);

  if (oppWp === "remote" || memberWp.includes(oppWp) || oppWp.includes(memberWp) || memberWp === "") {
    workplaceScore = 15;
    reasons.push({
      category: "workplace",
      title: "Workplace preference matches",
      detail: `Opportunity is ${opportunity.workplaceType}, compatible with candidate preference.`,
      matched: true,
      scoreContribution: 15,
    });
  } else {
    reasons.push({
      category: "workplace",
      title: "Workplace difference",
      detail: `Opportunity is ${opportunity.workplaceType}; member prefers ${member.preferredWorkType || "flexible"}.`,
      matched: false,
      scoreContribution: 0,
    });
  }
  totalScore += workplaceScore;

  // 4. LOCATION MATCH (Up to 10 points)
  let locationScore = 0;
  const memberLoc = normalize(member.location);
  const oppLoc = normalize(opportunity.location);

  if (
    oppWp === "remote" ||
    oppLoc.includes("remote") ||
    memberLoc.includes(oppLoc) ||
    oppLoc.includes(memberLoc) ||
    (memberLoc.includes("europe") && (oppLoc.includes("zurich") || oppLoc.includes("venice") || oppLoc.includes("copenhagen") || oppLoc.includes("london") || oppLoc.includes("berlin")))
  ) {
    locationScore = 10;
    reasons.push({
      category: "location",
      title: "Location compatible",
      detail: `Candidate in ${member.location || "Remote"} can accommodate ${opportunity.location}.`,
      matched: true,
      scoreContribution: 10,
    });
  } else {
    reasons.push({
      category: "location",
      title: "Geographic distance",
      detail: `Opportunity in ${opportunity.location} may require relocation from ${member.location || "current base"}.`,
      matched: false,
      scoreContribution: 0,
    });
  }
  totalScore += locationScore;

  return {
    scorePercentage: Math.min(100, Math.max(0, totalScore)),
    matchedSkills,
    missingSkills,
    reasons,
  };
}

/**
 * Ranks all members against a single opportunity
 */
export function rankMembersForOpportunity(
  members: CorMember[],
  opportunity: CorOpportunity
): MemberMatchResult[] {
  return members
    .map((member) => {
      const match = calculateMatch(member, opportunity);
      return {
        member,
        scorePercentage: match.scorePercentage,
        matchedSkillsCount: match.matchedSkills.length,
        totalRequiredSkills: opportunity.requiredSkills.length,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        reasons: match.reasons,
      };
    })
    .sort((a, b) => b.scorePercentage - a.scorePercentage);
}

/**
 * Ranks all opportunities for a single member
 */
export function rankOpportunitiesForMember(
  member: CorMember,
  opportunities: CorOpportunity[]
): OpportunityMatchResult[] {
  return opportunities
    .map((opp) => {
      const match = calculateMatch(member, opp);
      return {
        opportunity: opp,
        scorePercentage: match.scorePercentage,
        matchedSkillsCount: match.matchedSkills.length,
        totalRequiredSkills: opp.requiredSkills.length,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        reasons: match.reasons,
      };
    })
    .sort((a, b) => b.scorePercentage - a.scorePercentage);
}
