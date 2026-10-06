"use client";

import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from "lucide-react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { useToast } from "@/components/ui";

interface ExportColumn {
  header: string;
  key: string | ((row: any) => string | number);
}

interface ExportDropdownProps {
  data: any[];
  filename: string;
  columns: ExportColumn[];
  reportTitle?: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#141413" },
  subtitle: { fontSize: 10, color: "#6E6E69", marginBottom: 15 },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, borderColor: "#E8E8E3" },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: { width: "auto", borderStyle: "solid", borderBottomWidth: 1, borderRightWidth: 1, borderColor: "#E8E8E3", backgroundColor: "#F3F3EE", flex: 1 },
  tableCol: { width: "auto", borderStyle: "solid", borderBottomWidth: 1, borderRightWidth: 1, borderColor: "#E8E8E3", flex: 1 },
  tableCellHeader: { margin: 5, fontSize: 8, fontWeight: "bold", color: "#141413" },
  tableCell: { margin: 5, fontSize: 8, color: "#5E5E59" }
});

const ReportPDF = ({ data, columns, title }: { data: any[], columns: ExportColumn[], title: string }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <View style={styles.header}>
        <Text style={styles.title}>ERAS Studio - {title}</Text>
        <Text style={styles.subtitle}>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Records: {data.length}</Text>
      </View>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          {columns.map((col, i) => (
            <View style={styles.tableColHeader} key={i}>
              <Text style={styles.tableCellHeader}>{col.header}</Text>
            </View>
          ))}
        </View>
        {/* Table Rows */}
        {data.map((row, rowIndex) => (
          <View style={styles.tableRow} key={rowIndex} wrap={false}>
            {columns.map((col, colIndex) => {
              const val = typeof col.key === "function" ? col.key(row) : row[col.key];
              return (
                <View style={styles.tableCol} key={colIndex}>
                  <Text style={styles.tableCell}>{val != null ? String(val) : "-"}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export function ExportDropdown({ data, filename, columns, reportTitle }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);
  const toast = useToast();

  const handleExportCSV = async () => {
    try {
      setIsExporting("csv");
      setIsOpen(false);
      
      if (!data || data.length === 0) {
        toast.error("Export Failed", "No data available to export.");
        setIsExporting(null);
        return;
      }

      // Generate CSV content
      const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(",");
      const rows = data.map(row => {
        return columns.map(col => {
          const val = typeof col.key === "function" ? col.key(row) : row[col.key];
          const strVal = val != null ? String(val) : "";
          return `"${strVal.replace(/"/g, '""')}"`;
        }).join(",");
      });

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export Successful", "CSV downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Export Failed", "Unable to generate the export. Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting("pdf");
      setIsOpen(false);

      if (!data || data.length === 0) {
        toast.error("Export Failed", "No data available to export.");
        setIsExporting(null);
        return;
      }

      const blob = await pdf(<ReportPDF data={data} columns={columns} title={reportTitle || "Data Report"} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export Successful", "PDF downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Export Failed", "Unable to generate the export. Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:bg-[#F3F3EE] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8532F] shadow-2xs disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A8A85]" />
        ) : (
          <Download className="w-3.5 h-3.5 text-[#8A8A85]" />
        )}
        <span>{isExporting === "csv" ? "Preparing CSV..." : isExporting === "pdf" ? "Preparing PDF..." : "Download"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8A8A85]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 origin-top-right rounded-lg bg-white shadow-lg border border-[#E8E8E3] focus:outline-none py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={handleExportCSV}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#141413] hover:bg-[#F3F3EE] transition-colors text-left"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#8A8A85]" />
              Download CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#141413] hover:bg-[#F3F3EE] transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 text-[#8A8A85]" />
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
