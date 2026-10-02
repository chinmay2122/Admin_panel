import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Rect,
  Circle,
  Line,
  G,
} from "@react-pdf/renderer";
import { ReportData } from "./reportData";

const styles = StyleSheet.create({
  page: {
    size: "A4",
    orientation: "portrait",
    backgroundColor: "#FFFFFF",
    paddingTop: 34,
    paddingBottom: 30,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    color: "#141413",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  
  // Header Component
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E3",
    paddingBottom: 14,
    marginBottom: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brandBlock: {
    display: "flex",
    flexDirection: "column",
  },
  logoRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.3,
    color: "#141413",
  },
  brandSup: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#6E6E69",
    marginLeft: 1,
    marginTop: -4,
  },
  brandTagline: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#8A8A85",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  docMetaBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  docReportTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#B8532F",
    marginBottom: 2,
  },
  docPeriodText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
    marginBottom: 1,
  },
  docGeneratedText: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
  },

  // Main Content Area
  contentArea: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },

  // Section Headings
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#6E6E69",
    marginTop: 2,
  },

  // Page 1: KPI Grid (3 cols x 2 rows)
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  kpiCard: {
    width: "31.5%",
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  kpiLabelRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#6E6E69",
  },
  kpiBadge: {
    backgroundColor: "#F0DFD7",
    color: "#9E4323",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  kpiSubtext: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
  },

  // Executive Summary Box
  summaryBox: {
    backgroundColor: "#FAFAF8",
    borderLeftWidth: 3,
    borderLeftColor: "#B8532F",
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  summaryHeader: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#141413",
    marginBottom: 6,
  },
  summaryParagraph: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#383835",
    lineHeight: 1.55,
  },

  // Quick Highlights Strip
  highlightsRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E3",
    paddingTop: 12,
  },
  highlightItem: {
    width: "31%",
  },
  highlightTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#8A8A85",
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#555550",
    lineHeight: 1.35,
  },

  // Page 2: Activity Matrix (2x2 Grid)
  activityGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  activityCard: {
    width: "48.5%",
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 11,
    marginBottom: 10,
  },
  activityHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAE5",
    paddingBottom: 5,
    marginBottom: 8,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityCategoryTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#141413",
  },
  activityRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  activityRowLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#6E6E69",
  },
  activityRowValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
  },

  // Page 2 Charts Section
  chartsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  chartBox: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 11,
    backgroundColor: "#FFFFFF",
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
    marginBottom: 10,
  },

  // Page 3: Tables
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeaderRow: {
    backgroundColor: "#FAFAF8",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E3",
    display: "flex",
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#6E6E69",
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0EB",
    display: "flex",
    flexDirection: "row",
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#FCFCFB",
  },
  tableCell: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#141413",
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
  },
  tableCellMuted: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#71716D",
  },
  statusBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    textAlign: "center",
  },

  // Page 3: Plan Distribution
  planSection: {
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#FAFAF8",
  },
  planSectionHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#141413",
  },
  planCardsRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  planItemCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 5,
    padding: 7,
  },
  planItemName: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#6E6E69",
    marginBottom: 2,
  },
  planItemCount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#141413",
  },
  planItemPct: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
  },

  // Page 4: Insights & Areas to Watch
  insightList: {
    marginBottom: 14,
  },
  insightItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "#E8E8E3",
    borderRadius: 6,
    padding: 9,
  },
  insightNumber: {
    width: 26,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#B8532F",
    letterSpacing: 0.3,
  },
  insightText: {
    flexGrow: 1,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#30302E",
    lineHeight: 1.45,
  },

  watchBox: {
    backgroundColor: "#FCFAF6",
    borderWidth: 1,
    borderColor: "#ECDDBB",
    borderRadius: 6,
    padding: 11,
    marginBottom: 14,
  },
  watchTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#865E16",
    marginBottom: 4,
  },
  watchText: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#504122",
    lineHeight: 1.45,
  },

  closingBox: {
    borderTopWidth: 1,
    borderTopColor: "#E8E8E3",
    paddingTop: 12,
  },
  closingTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#141413",
    marginBottom: 4,
  },
  closingText: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#6E6E69",
    lineHeight: 1.5,
  },

  // Universal Footer
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E8E8E3",
    paddingTop: 9,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
  },
  footerCenter: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#6E6E69",
  },
  footerRight: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#8A8A85",
  },
});

interface DocumentProps {
  data: ReportData;
}

export function StudioPerformanceDocument({ data }: DocumentProps) {
  const totalUsersSafe = Math.max(data.userActivity.total, 1);
  const totalArtworksSafe = Math.max(data.artworkActivity.total, 1);

  return (
    <Document
      title={`${data.appName} — Studio Performance Report`}
      author={`${data.appName} Curatorial Console`}
      subject={`Performance Metrics (${data.startDateFormatted} - ${data.endDateFormatted})`}
    >
      {/* ========================================================================= */}
      {/* PAGE 1 — EXECUTIVE SUMMARY */}
      {/* ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View wrap={false} style={styles.headerContainer}>
          <View style={styles.brandBlock}>
            <View style={styles.logoRow}>
              <Text style={styles.brandName}>ErasStudio</Text>
              <Text style={styles.brandSup}>®</Text>
            </View>
            <Text style={styles.brandTagline}>
              Curatorial Console · Fine Art & Creative Platform
            </Text>
          </View>
          <View style={styles.docMetaBlock}>
            <Text style={styles.docReportTitle}>Studio Performance Report</Text>
            <Text style={styles.docPeriodText}>
              Period: {data.startDateFormatted} – {data.endDateFormatted}
            </Text>
            <Text style={styles.docGeneratedText}>
              Generated: {data.generatedAtFormatted}
            </Text>
          </View>
        </View>

        <View wrap={false} style={styles.contentArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Executive Key Indicators</Text>
            <Text style={styles.sectionSubtitle}>
              Core platform benchmarks and member registration volume for the selected timeframe.
            </Text>
          </View>

          {/* 6 Preferred KPI Cards */}
          <View style={styles.kpiGrid}>
            {data.kpis.map((kpi, idx) => (
              <View key={idx} style={styles.kpiCard}>
                <View style={styles.kpiLabelRow}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  {kpi.badge ? (
                    <Text style={styles.kpiBadge}>{kpi.badge}</Text>
                  ) : null}
                </View>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <Text style={styles.kpiSubtext}>{kpi.subtext}</Text>
              </View>
            ))}
          </View>

          {/* Dynamic Executive Summary Box */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryHeader}>Executive Summary</Text>
            <Text style={styles.summaryParagraph}>
              {data.executiveSummaryText}
            </Text>
          </View>

          {/* Highlights Row */}
          <View style={styles.highlightsRow}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightTitle}>Platform Tier Health</Text>
              <Text style={styles.highlightDesc}>
                Pro and Elite memberships provide sustained artist participation and verified portfolio access.
              </Text>
            </View>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightTitle}>Curatorial Standard</Text>
              <Text style={styles.highlightDesc}>
                All incoming creator portfolios undergo verification before entering active institutional visibility.
              </Text>
            </View>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightTitle}>Institutional Network</Text>
              <Text style={styles.highlightDesc}>
                COR Committee chairs actively oversee jury selections, open calls, and regional studio residencies.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View wrap={false} style={styles.footerContainer}>
          <Text style={styles.footerLeft}>
            ErasStudio · Studio Performance Report
          </Text>
          <Text style={styles.footerCenter}>Page 1 of 4</Text>
          <Text style={styles.footerRight}>
            Confidential · For authorized use only
          </Text>
        </View>
      </Page>

      {/* ========================================================================= */}
      {/* PAGE 2 — PLATFORM PERFORMANCE */}
      {/* ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View wrap={false} style={styles.headerContainer}>
          <View style={styles.brandBlock}>
            <View style={styles.logoRow}>
              <Text style={styles.brandName}>ErasStudio</Text>
              <Text style={styles.brandSup}>®</Text>
            </View>
            <Text style={styles.brandTagline}>Platform Performance & Member Trajectory</Text>
          </View>
          <View style={styles.docMetaBlock}>
            <Text style={styles.docReportTitle}>Platform Performance</Text>
            <Text style={styles.docPeriodText}>
              {data.startDateFormatted} – {data.endDateFormatted}
            </Text>
          </View>
        </View>

        <View wrap={false} style={styles.contentArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platform Performance</Text>
            <Text style={styles.sectionSubtitle}>
              Comprehensive member engagement, artist onboarding, and catalog throughput metrics.
            </Text>
          </View>

          {/* 4 Activity Cards (User, Creator, Collector, Artwork) */}
          <View style={styles.activityGrid}>
            {/* User Activity */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityCategoryTitle}>User Activity</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Total Users</Text>
                <Text style={styles.activityRowValue}>{data.userActivity.total}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>New in Period</Text>
                <Text style={styles.activityRowValue}>+{data.userActivity.newInPeriod}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Active Accounts</Text>
                <Text style={styles.activityRowValue}>{data.userActivity.active}</Text>
              </View>
            </View>

            {/* Creator Activity */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityCategoryTitle}>Creator Activity</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Total Creators</Text>
                <Text style={styles.activityRowValue}>{data.creatorActivity.total}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>New in Period</Text>
                <Text style={styles.activityRowValue}>+{data.creatorActivity.newInPeriod}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Active Portfolios</Text>
                <Text style={styles.activityRowValue}>{data.creatorActivity.active}</Text>
              </View>
            </View>

            {/* Collector Activity */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityCategoryTitle}>Collector Activity</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Total Collectors</Text>
                <Text style={styles.activityRowValue}>{data.collectorActivity.total}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>New in Period</Text>
                <Text style={styles.activityRowValue}>+{data.collectorActivity.newInPeriod}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Active Curators & Buyers</Text>
                <Text style={styles.activityRowValue}>{data.collectorActivity.active}</Text>
              </View>
            </View>

            {/* Artwork Activity */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityCategoryTitle}>Artwork Activity</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Total Artworks</Text>
                <Text style={styles.activityRowValue}>{data.artworkActivity.total}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>New in Period</Text>
                <Text style={styles.activityRowValue}>+{data.artworkActivity.newInPeriod}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityRowLabel}>Published / Available</Text>
                <Text style={styles.activityRowValue}>{data.artworkActivity.published}</Text>
              </View>
            </View>
          </View>

          {/* 2 Simple Vector SVG Charts */}
          <View style={styles.chartsContainer}>
            {/* Chart 1: Member Composition */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Chart 1: Member Community Breakdown</Text>
              <Text style={styles.chartSubtitle}>
                Proportional distribution across key platform participant roles.
              </Text>
              
              <View style={{ marginTop: 6, marginBottom: 4 }}>
                <Svg height="110" width="230">
                  {/* Background Grid Lines */}
                  <Line x1="70" y1="10" x2="225" y2="10" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="35" x2="225" y2="35" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="60" x2="225" y2="60" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="85" x2="225" y2="85" stroke="#F0F0EB" strokeWidth="1" />

                  {/* Creators Bar */}
                  <Rect
                    x="70"
                    y="6"
                    width={Math.min(145, Math.max(12, (data.roleDistribution.creators / totalUsersSafe) * 145))}
                    height="10"
                    fill="#141413"
                    rx="2"
                  />
                  {/* Collectors Bar */}
                  <Rect
                    x="70"
                    y="31"
                    width={Math.min(145, Math.max(12, (data.roleDistribution.collectors / totalUsersSafe) * 145))}
                    height="10"
                    fill="#B8532F"
                    rx="2"
                  />
                  {/* Pro / Elite Bar */}
                  <Rect
                    x="70"
                    y="56"
                    width={Math.min(145, Math.max(12, (data.roleDistribution.proMembers / totalUsersSafe) * 145))}
                    height="10"
                    fill="#8A8A85"
                    rx="2"
                  />
                  {/* COR Committee Bar */}
                  <Rect
                    x="70"
                    y="81"
                    width={Math.min(145, Math.max(12, (data.roleDistribution.corMembers / totalUsersSafe) * 145))}
                    height="10"
                    fill="#D0D0CA"
                    rx="2"
                  />
                </Svg>
                
                {/* Chart 1 Labels Overlay */}
                <View style={{ marginTop: -110, paddingRight: 6 }}>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Creators</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.roleDistribution.creators}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Collectors</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.roleDistribution.collectors}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Pro / Elite</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.roleDistribution.proMembers}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>COR Chairs</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.roleDistribution.corMembers}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Chart 2: Artwork Catalog Status */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Chart 2: Artwork Catalog Status Distribution</Text>
              <Text style={styles.chartSubtitle}>
                Verification and curatorial state of all submitted artworks.
              </Text>

              <View style={{ marginTop: 6, marginBottom: 4 }}>
                <Svg height="110" width="230">
                  <Line x1="70" y1="10" x2="225" y2="10" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="35" x2="225" y2="35" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="60" x2="225" y2="60" stroke="#F0F0EB" strokeWidth="1" />
                  <Line x1="70" y1="85" x2="225" y2="85" stroke="#F0F0EB" strokeWidth="1" />

                  {/* Published */}
                  <Rect
                    x="70"
                    y="6"
                    width={Math.min(145, Math.max(12, (data.artworkActivity.published / totalArtworksSafe) * 145))}
                    height="10"
                    fill="#141413"
                    rx="2"
                  />
                  {/* Pending Review */}
                  <Rect
                    x="70"
                    y="31"
                    width={Math.min(145, Math.max(12, (data.artworkActivity.pending / totalArtworksSafe) * 145))}
                    height="10"
                    fill="#B8532F"
                    rx="2"
                  />
                  {/* Draft */}
                  <Rect
                    x="70"
                    y="56"
                    width={Math.min(145, Math.max(12, (data.artworkActivity.draft / totalArtworksSafe) * 145))}
                    height="10"
                    fill="#8A8A85"
                    rx="2"
                  />
                  {/* Rejected */}
                  <Rect
                    x="70"
                    y="81"
                    width={Math.min(145, Math.max(12, (data.artworkActivity.rejected / totalArtworksSafe) * 145))}
                    height="10"
                    fill="#DCDCD5"
                    rx="2"
                  />
                </Svg>

                <View style={{ marginTop: -110, paddingRight: 6 }}>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Published</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.artworkActivity.published}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>In Review</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#B8532F" }}>{data.artworkActivity.pending}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Drafts</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.artworkActivity.draft}</Text>
                  </View>
                  <View style={{ height: 25, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#6E6E69", width: 65 }}>Rejected</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#141413" }}>{data.artworkActivity.rejected}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View wrap={false} style={styles.footerContainer}>
          <Text style={styles.footerLeft}>
            ErasStudio · Studio Performance Report
          </Text>
          <Text style={styles.footerCenter}>Page 2 of 4</Text>
          <Text style={styles.footerRight}>
            Confidential · For authorized use only
          </Text>
        </View>
      </Page>

      {/* ========================================================================= */}
      {/* PAGE 3 — CONTENT & CONVERSION */}
      {/* ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View wrap={false} style={styles.headerContainer}>
          <View style={styles.brandBlock}>
            <View style={styles.logoRow}>
              <Text style={styles.brandName}>ErasStudio</Text>
              <Text style={styles.brandSup}>®</Text>
            </View>
            <Text style={styles.brandTagline}>Content Portfolio & Plan Distribution</Text>
          </View>
          <View style={styles.docMetaBlock}>
            <Text style={styles.docReportTitle}>Content & Conversion</Text>
            <Text style={styles.docPeriodText}>
              {data.startDateFormatted} – {data.endDateFormatted}
            </Text>
          </View>
        </View>

        <View wrap={false} style={styles.contentArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content & Conversion</Text>
            <Text style={styles.sectionSubtitle}>
              Curated artwork catalog rankings, primary artist output, and platform subscription breakdown.
            </Text>
          </View>

          {/* Section 1: Top 5 Artworks */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#141413", marginBottom: 5 }}>
              Top Performing Artworks (Top 5 Valuation)
            </Text>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: "34%" }]}>Artwork</Text>
                <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Creator</Text>
                <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Medium</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Price</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>Status</Text>
              </View>

              {data.topArtworks.map((art, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <View style={{ width: "34%", display: "flex", flexDirection: "row", alignItems: "center" }}>
                    {idx === 0 && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#B8532F", marginRight: 5 }} />
                    )}
                    <Text style={styles.tableCellBold}>
                      {art.title}
                    </Text>
                  </View>
                  <Text style={[styles.tableCellMuted, { width: "24%" }]}>
                    {art.creatorName}
                  </Text>
                  <Text style={[styles.tableCellMuted, { width: "22%" }]}>
                    {art.medium}
                  </Text>
                  <Text style={[styles.tableCellBold, { width: "10%", textAlign: "right" }]}>
                    {art.priceFormatted}
                  </Text>
                  <View style={{ width: "10%", display: "flex", alignItems: "center" }}>
                    <Text
                      style={[
                        styles.statusBadge,
                        art.status === "Published"
                          ? { backgroundColor: "#EAF2EC", color: "#28633B" }
                          : { backgroundColor: "#FAF5EC", color: "#865E16" },
                      ]}
                    >
                      {art.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Section 2: Top 5 Creators */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#141413", marginBottom: 5 }}>
              Creator Performance (Top 5 by Catalog Volume)
            </Text>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: "32%" }]}>Creator</Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Primary Discipline</Text>
                <Text style={[styles.tableHeaderCell, { width: "16%", textAlign: "center" }]}>Catalog Artworks</Text>
                <Text style={[styles.tableHeaderCell, { width: "11%", textAlign: "center" }]}>Tier</Text>
                <Text style={[styles.tableHeaderCell, { width: "11%", textAlign: "center" }]}>Status</Text>
              </View>

              {data.topCreators.map((creator, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCellBold, { width: "32%" }]}>
                    {creator.name}
                  </Text>
                  <Text style={[styles.tableCellMuted, { width: "30%" }]}>
                    {creator.discipline}
                  </Text>
                  <Text style={[styles.tableCellBold, { width: "16%", textAlign: "center" }]}>
                    {creator.artworksCount} {creator.artworksCount === 1 ? "work" : "works"}
                  </Text>
                  <View style={{ width: "11%", display: "flex", alignItems: "center" }}>
                    <Text
                      style={[
                        styles.statusBadge,
                        creator.plan === "ELITE"
                          ? { backgroundColor: "#141413", color: "#FFFFFF" }
                          : creator.plan === "PRO"
                          ? { backgroundColor: "#F0DFD7", color: "#9E4323" }
                          : { backgroundColor: "#F0F0EB", color: "#6E6E69" },
                      ]}
                    >
                      {creator.plan}
                    </Text>
                  </View>
                  <View style={{ width: "11%", display: "flex", alignItems: "center" }}>
                    <Text
                      style={[
                        styles.statusBadge,
                        creator.status === "Active"
                          ? { backgroundColor: "#EAF2EC", color: "#28633B" }
                          : { backgroundColor: "#FAF5EC", color: "#865E16" },
                      ]}
                    >
                      {creator.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Section 3: Plan Distribution (labeled strictly CURRENT PLAN DISTRIBUTION) */}
          <View style={styles.planSection}>
            <View style={styles.planSectionHeader}>
              <Text style={styles.planSectionTitle}>CURRENT PLAN DISTRIBUTION</Text>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica", color: "#8A8A85" }}>
                Active user and creator subscription volume
              </Text>
            </View>

            {/* Horizontal Segmented Bar */}
            <View style={{ marginTop: 2, marginBottom: 8 }}>
              <Svg height="12" width="500">
                {/* Free Segment */}
                <Rect
                  x="0"
                  y="0"
                  width={Math.max(15, (data.planDistribution[0].percentage / 100) * 500)}
                  height="10"
                  fill="#8A8A85"
                  rx="2"
                />
                {/* Pro Segment */}
                <Rect
                  x={(data.planDistribution[0].percentage / 100) * 500}
                  y="0"
                  width={Math.max(15, (data.planDistribution[1].percentage / 100) * 500)}
                  height="10"
                  fill="#B8532F"
                  rx="2"
                />
                {/* Elite Segment */}
                <Rect
                  x={((data.planDistribution[0].percentage + data.planDistribution[1].percentage) / 100) * 500}
                  y="0"
                  width={Math.max(15, (data.planDistribution[2].percentage / 100) * 500)}
                  height="10"
                  fill="#141413"
                  rx="2"
                />
              </Svg>
            </View>

            <View style={styles.planCardsRow}>
              {data.planDistribution.map((plan, idx) => (
                <View key={idx} style={styles.planItemCard}>
                  <View style={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: plan.color, marginRight: 5 }} />
                    <Text style={styles.planItemName}>{plan.name} Tier</Text>
                  </View>
                  <Text style={styles.planItemCount}>{plan.count} profiles</Text>
                  <Text style={styles.planItemPct}>{plan.percentage}% of network</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View wrap={false} style={styles.footerContainer}>
          <Text style={styles.footerLeft}>
            ErasStudio · Studio Performance Report
          </Text>
          <Text style={styles.footerCenter}>Page 3 of 4</Text>
          <Text style={styles.footerRight}>
            Confidential · For authorized use only
          </Text>
        </View>
      </Page>

      {/* ========================================================================= */}
      {/* PAGE 4 — KEY INSIGHTS */}
      {/* ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View wrap={false} style={styles.headerContainer}>
          <View style={styles.brandBlock}>
            <View style={styles.logoRow}>
              <Text style={styles.brandName}>ErasStudio</Text>
              <Text style={styles.brandSup}>®</Text>
            </View>
            <Text style={styles.brandTagline}>Strategic Insights & Curatorial Guidance</Text>
          </View>
          <View style={styles.docMetaBlock}>
            <Text style={styles.docReportTitle}>Key Insights</Text>
            <Text style={styles.docPeriodText}>
              {data.startDateFormatted} – {data.endDateFormatted}
            </Text>
          </View>
        </View>

        <View wrap={false} style={styles.contentArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Key Insights & Strategic Observations</Text>
            <Text style={styles.sectionSubtitle}>
              Synthesized findings and recommendations derived from live platform metrics.
            </Text>
          </View>

          {/* 3–5 Data-Driven Insights */}
          <View style={styles.insightList}>
            {data.keyInsights.map((insight, idx) => (
              <View key={idx} style={styles.insightItem}>
                <Text style={styles.insightNumber}>
                  {String(idx + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          {/* Areas to Watch (Only if data supports a meaningful observation) */}
          {data.areasToWatch && (
            <View style={styles.watchBox}>
              <Text style={styles.watchTitle}>Areas to Watch</Text>
              <Text style={styles.watchText}>{data.areasToWatch}</Text>
            </View>
          )}

          {/* Closing Report Summary */}
          <View style={styles.closingBox}>
            <Text style={styles.closingTitle}>Report Summary</Text>
            <Text style={styles.closingText}>{data.closingSummaryText}</Text>
          </View>

          {/* Authenticity & Authorization Stamp */}
          <View
            style={{
              marginTop: 18,
              borderWidth: 1,
              borderColor: "#E8E8E3",
              borderRadius: 6,
              padding: 10,
              backgroundColor: "#FAFAF8",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#141413" }}>
                Curatorial Console Verification
              </Text>
              <Text style={{ fontSize: 7, fontFamily: "Helvetica", color: "#8A8A85", marginTop: 2 }}>
                Generated securely from verified platform records. No simulated statistics.
              </Text>
            </View>
            <View style={{ display: "flex", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#28633B" }}>
                ✓ Certified Authentic
              </Text>
              <Text style={{ fontSize: 6.5, fontFamily: "Helvetica", color: "#8A8A85", marginTop: 1 }}>
                System Build Next.js 16
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View wrap={false} style={styles.footerContainer}>
          <Text style={styles.footerLeft}>
            ErasStudio · Studio Performance Report
          </Text>
          <Text style={styles.footerCenter}>Page 4 of 4</Text>
          <Text style={styles.footerRight}>
            Confidential · For authorized use only
          </Text>
        </View>
      </Page>
    </Document>
  );
}
