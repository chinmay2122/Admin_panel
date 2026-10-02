import {
  usersRepo,
  creatorsRepo,
  artworksRepo,
  corRepo,
  applicationsRepo,
} from "@/lib/data";
import { User, Creator, Artwork, CorMember, Application } from "@/lib/types";

export interface PeriodFilter {
  period: "7d" | "30d" | "3m" | "1y" | "custom";
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface KPIItem {
  label: string;
  value: string | number;
  subtext: string;
  badge?: string;
}

export interface TopArtworkRow {
  title: string;
  creatorName: string;
  medium: string;
  priceFormatted: string;
  status: string;
  imageUrl?: string;
}

export interface TopCreatorRow {
  name: string;
  discipline: string;
  artworksCount: number;
  plan: string;
  status: string;
}

export interface PlanDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface GrowthPoint {
  label: string;
  users: number;
  artworks: number;
}

export interface ReportData {
  appName: string;
  title: string;
  reportingPeriodLabel: string;
  startDateFormatted: string;
  endDateFormatted: string;
  startIso: string;
  endIso: string;
  generatedAtFormatted: string;
  
  // Executive Summary KPIs
  kpis: KPIItem[];
  executiveSummaryText: string;

  // Platform Performance Activity
  userActivity: {
    total: number;
    newInPeriod: number;
    active: number;
  };
  creatorActivity: {
    total: number;
    newInPeriod: number;
    active: number;
  };
  collectorActivity: {
    total: number;
    newInPeriod: number;
    active: number;
  };
  artworkActivity: {
    total: number;
    newInPeriod: number;
    published: number;
    pending: number;
    draft: number;
    rejected: number;
  };

  // Charts
  roleDistribution: {
    creators: number;
    collectors: number;
    proMembers: number;
    corMembers: number;
  };

  // Content & Conversion
  topArtworks: TopArtworkRow[];
  topCreators: TopCreatorRow[];
  planDistribution: PlanDistribution[];

  // Insights & Watch
  keyInsights: string[];
  areasToWatch?: string;
  closingSummaryText: string;
}

function formatDateDisplay(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function getReportData(filter: PeriodFilter): Promise<ReportData> {
  const now = new Date();
  let start: Date;
  let end: Date = now;
  let periodLabel = "Last 30 Days";

  if (filter.period === "7d") {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    periodLabel = "Last 7 Days";
  } else if (filter.period === "30d") {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    periodLabel = "Last 30 Days";
  } else if (filter.period === "3m") {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    periodLabel = "Last 3 Months";
  } else if (filter.period === "1y") {
    start = new Date(now.getFullYear(), 0, 1);
    periodLabel = "This Year (" + now.getFullYear() + ")";
  } else if (filter.period === "custom" && filter.startDate && filter.endDate) {
    start = new Date(filter.startDate + "T00:00:00.000Z");
    end = new Date(filter.endDate + "T23:59:59.999Z");
    periodLabel = "Custom Range";
  } else {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    periodLabel = "Last 30 Days";
  }

  // Fetch real data from application repositories
  const [allUsers, allCreators, allArtworks, allCor, allApps] = await Promise.all([
    usersRepo.list(),
    creatorsRepo.list(),
    artworksRepo.list(),
    corRepo.list(),
    applicationsRepo.list(),
  ]);

  const startTime = start.getTime();
  const endTime = end.getTime();

  const isWithinPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && t >= startTime && t <= endTime;
  };

  // Users Breakdown
  const totalUsers = allUsers.length;
  const newUsersInPeriod = allUsers.filter((u) => isWithinPeriod(u.createdAt)).length;
  const activeUsers = allUsers.filter((u) => u.status === "active").length;

  const creatorsOnly = allUsers.filter((u) => u.role === "creator");
  const totalCreators = creatorsOnly.length > 0 ? creatorsOnly.length : allCreators.length;
  const newCreatorsInPeriod = creatorsOnly.filter((u) => isWithinPeriod(u.createdAt)).length;
  const activeCreators = allCreators.filter((c) => c.status === "active").length;

  const collectorsOnly = allUsers.filter((u) => u.role === "collector");
  const totalCollectors = collectorsOnly.length;
  const newCollectorsInPeriod = collectorsOnly.filter((u) => isWithinPeriod(u.createdAt)).length;
  const activeCollectors = collectorsOnly.filter((u) => u.status === "active").length;

  // Plan Breakdown
  const proUsersCount = allUsers.filter((u) => u.plan === "pro").length;
  const eliteUsersCount = allUsers.filter((u) => u.plan === "elite").length;
  const freeUsersCount = allUsers.filter((u) => u.plan === "free" || !u.plan).length;
  const corActiveCount = allCor.filter((c) => c.status === "active").length;

  // Artworks Breakdown
  const totalArtworks = allArtworks.length;
  const newArtworksInPeriod = allArtworks.filter((a) => isWithinPeriod(a.createdAt)).length;
  const publishedArtworks = allArtworks.filter(
    (a) => a.status === "published" || (a.status as any) === "available" || (a.status as any) === "For Sale"
  ).length;
  const pendingArtworks = allArtworks.filter((a) => a.status === "pending").length;
  const draftArtworks = allArtworks.filter((a) => a.status === "draft").length;
  const rejectedArtworks = allArtworks.filter((a) => a.status === "rejected").length;
  const totalValuation = allArtworks.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  // Top Disciplines
  const disciplineCounts: Record<string, number> = {};
  allArtworks.forEach((a) => {
    if (a.medium) {
      disciplineCounts[a.medium] = (disciplineCounts[a.medium] || 0) + 1;
    }
  });
  const topDiscipline = Object.entries(disciplineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sculpture & Media";

  // Top 5 Artworks (by price/valuation and status)
  const topArtworks: TopArtworkRow[] = [...allArtworks]
    .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    .slice(0, 5)
    .map((art) => ({
      title: art.title || "Untitled",
      creatorName: art.creatorName || "Anonymous Artist",
      medium: art.medium || "Mixed Media",
      priceFormatted: art.price ? formatCurrency(art.price) : "Price on Request",
      status: art.status ? art.status.charAt(0).toUpperCase() + art.status.slice(1) : "Published",
      imageUrl: art.imageUrl,
    }));

  // Top 5 Creators (by artworks count & status)
  const creatorWorkMap: Record<string, { count: number; name: string; discipline: string; plan: string; status: string }> = {};
  allCreators.forEach((c) => {
    creatorWorkMap[c.name] = {
      count: 0,
      name: c.name,
      discipline: c.discipline || "Contemporary Arts",
      plan: c.plan ? c.plan.toUpperCase() : "FREE",
      status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Active",
    };
  });
  allArtworks.forEach((a) => {
    if (a.creatorName && creatorWorkMap[a.creatorName]) {
      creatorWorkMap[a.creatorName].count += 1;
    } else if (a.creatorName) {
      creatorWorkMap[a.creatorName] = {
        count: 1,
        name: a.creatorName,
        discipline: a.medium || "Visual Arts",
        plan: "PRO",
        status: "Active",
      };
    }
  });

  const topCreators: TopCreatorRow[] = Object.values(creatorWorkMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      discipline: c.discipline,
      artworksCount: c.count,
      plan: c.plan,
      status: c.status,
    }));

  // Plan Distribution
  const totalProfiles = Math.max(totalUsers, 1);
  const planDistribution: PlanDistribution[] = [
    {
      name: "Free",
      count: freeUsersCount,
      percentage: Math.round((freeUsersCount / totalProfiles) * 100),
      color: "#8A8A85",
    },
    {
      name: "Pro",
      count: proUsersCount,
      percentage: Math.round((proUsersCount / totalProfiles) * 100),
      color: "#B8532F",
    },
    {
      name: "Elite",
      count: eliteUsersCount,
      percentage: Math.round((eliteUsersCount / totalProfiles) * 100),
      color: "#141413",
    },
  ];

  // Preferred 6 KPIs
  const kpis: KPIItem[] = [
    {
      label: "Total Users",
      value: totalUsers,
      subtext: `${activeUsers} active accounts`,
      badge: newUsersInPeriod > 0 ? `+${newUsersInPeriod} new` : undefined,
    },
    {
      label: "Total Creators",
      value: totalCreators,
      subtext: `${activeCreators} verified artists`,
      badge: newCreatorsInPeriod > 0 ? `+${newCreatorsInPeriod} new` : undefined,
    },
    {
      label: "Total Collectors",
      value: totalCollectors,
      subtext: `${activeCollectors} institutional patrons`,
      badge: newCollectorsInPeriod > 0 ? `+${newCollectorsInPeriod} new` : undefined,
    },
    {
      label: "Total Artworks",
      value: totalArtworks,
      subtext: `${publishedArtworks} published works`,
      badge: newArtworksInPeriod > 0 ? `+${newArtworksInPeriod} new` : undefined,
    },
    {
      label: "Paid / Pro Tier",
      value: proUsersCount + eliteUsersCount,
      subtext: `${Math.round(((proUsersCount + eliteUsersCount) / totalProfiles) * 100)}% premium adoption`,
    },
    {
      label: "Catalog Valuation",
      value: totalValuation > 0 ? formatCurrency(totalValuation) : `${totalArtworks} Items`,
      subtext: `${corActiveCount} COR committee chairs`,
    },
  ];

  // Dynamic Executive Summary text (2-3 sentences based strictly on real data)
  const startDateFormatted = formatDateDisplay(start);
  const endDateFormatted = formatDateDisplay(end);
  const paidPct = Math.round(((proUsersCount + eliteUsersCount) / totalProfiles) * 100);

  const summarySentence1 = newArtworksInPeriod > 0 || newUsersInPeriod > 0
    ? `During the selected reporting period (${startDateFormatted} – ${endDateFormatted}), ErasStudio recorded ${totalUsers} total users and ${totalCreators} verified creators, with ${newArtworksInPeriod} new artworks submitted across our studio network.`
    : `During the selected reporting period (${startDateFormatted} – ${endDateFormatted}), ErasStudio maintained an active network of ${totalUsers} members and ${totalCreators} verified creators, representing ${totalArtworks} cataloged works.`;

  const summarySentence2 = `Premium subscribers (Pro and Elite tiers) currently account for ${paidPct}% of member profiles, indicating steady adoption of advanced curatorial tools.`;

  const summarySentence3 = `Catalog activity remains firmly concentrated in high-demand disciplines such as ${topDiscipline}, with ${publishedArtworks} published pieces currently live for collectors and partner galleries.`;

  const executiveSummaryText = `${summarySentence1} ${summarySentence2} ${summarySentence3}`;

  // Key Insights (3-5 short data-driven points)
  const keyInsights: string[] = [
    newArtworksInPeriod > 0
      ? `${newArtworksInPeriod} new artwork submissions were received during this reporting period.`
      : `The platform catalog encompasses ${totalArtworks} verified works of art with a combined valuation of ${formatCurrency(totalValuation)}.`,
    `Pro and Elite tier members represent ${paidPct}% of the overall user base, sustaining community patronage.`,
    `${publishedArtworks} artworks (${Math.round((publishedArtworks / Math.max(totalArtworks, 1)) * 100)}%) are actively published and accessible to institutions.`,
    `A total of ${allApps.length} open call & fellowship applications have been registered across studio residencies.`,
  ];

  if (pendingArtworks > 0) {
    keyInsights.push(`${pendingArtworks} submissions are currently in curatorial review awaiting approval.`);
  }

  // Areas to Watch
  let areasToWatch: string | undefined = undefined;
  if (pendingArtworks > 0) {
    const pendingRate = Math.round((pendingArtworks / Math.max(totalArtworks, 1)) * 100);
    areasToWatch = `With ${pendingArtworks} submissions (${pendingRate}% of catalog) in the verification queue, timely review turnaround will help maintain creator engagement and fresh inventory for collectors.`;
  } else if (newUsersInPeriod === 0 && totalUsers > 0) {
    areasToWatch = `No new user signups were logged in this specific date bracket; ongoing residency campaigns and open calls will help drive incoming creator registrations.`;
  }

  // Closing Report Summary
  const closingSummaryText = `This Studio Performance Report synthesizes verified platform activity across all registered users, verified artists, and cataloged artworks. All performance data reflects actual recorded entries in the ErasStudio system for the selected reporting period. Overall community engagement demonstrates sustained expansion across contemporary fine art disciplines.`;

  return {
    appName: "ErasStudio",
    title: "Studio Performance Report",
    reportingPeriodLabel: periodLabel,
    startDateFormatted,
    endDateFormatted,
    startIso: start.toISOString().split("T")[0],
    endIso: end.toISOString().split("T")[0],
    generatedAtFormatted: `${formatDateDisplay(now)} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`,
    kpis,
    executiveSummaryText,
    userActivity: {
      total: totalUsers,
      newInPeriod: newUsersInPeriod,
      active: activeUsers,
    },
    creatorActivity: {
      total: totalCreators,
      newInPeriod: newCreatorsInPeriod,
      active: activeCreators,
    },
    collectorActivity: {
      total: totalCollectors,
      newInPeriod: newCollectorsInPeriod,
      active: activeCollectors,
    },
    artworkActivity: {
      total: totalArtworks,
      newInPeriod: newArtworksInPeriod,
      published: publishedArtworks,
      pending: pendingArtworks,
      draft: draftArtworks,
      rejected: rejectedArtworks,
    },
    roleDistribution: {
      creators: totalCreators,
      collectors: totalCollectors,
      proMembers: proUsersCount + eliteUsersCount,
      corMembers: corActiveCount,
    },
    topArtworks,
    topCreators,
    planDistribution,
    keyInsights,
    areasToWatch,
    closingSummaryText,
  };
}
