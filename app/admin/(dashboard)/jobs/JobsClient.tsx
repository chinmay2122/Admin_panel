"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Building,
  MapPin,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Job, JobStatus } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar, FilterSelectConfig } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui";
import {
  createJobAction,
  updateJobAction,
  deleteJobAction,
} from "@/app/admin/actions";

interface JobsClientProps {
  initialJobs: Job[];
}

export function JobsClient({ initialJobs }: JobsClientProps) {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "contract",
    location: "",
    status: "open" as JobStatus,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          !job.title.toLowerCase().includes(q) &&
          !job.company.toLowerCase().includes(q) &&
          !job.location.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, statusFilter]);

  // Pagination
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Open Create Job Modal
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: "",
      company: "",
      type: "contract",
      location: "",
      status: "open",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Job Modal
  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      type: job.type,
      location: job.location,
      status: job.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Job title is required.";
    if (!formData.company.trim()) errors.company = "Company/Studio is required.";
    if (!formData.location.trim()) errors.location = "Location is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save (Create or Edit) optimistically
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);

    if (editingJob) {
      // Edit mode (optimistic)
      const previous = [...jobs];
      const updatedJob: Job = {
        ...editingJob,
        ...formData,
      };

      setJobs((prev) =>
        prev.map((j) => (j.id === editingJob.id ? updatedJob : j))
      );
      setIsModalOpen(false);

      try {
        const res = await updateJobAction(editingJob.id, formData);
        if (!res.success) {
          setJobs(previous);
          toast.error("Failed to update job", res.error || "Please try again.");
        } else {
          toast.success("Job updated", `"${formData.title}" updated successfully.`);
        }
      } catch {
        setJobs(previous);
        toast.error("Network error", "Could not update job.");
      } finally {
        setIsSaving(false);
      }
    } else {
      // Create mode (optimistic)
      const tempId = `job_${Date.now()}`;
      const newJob: Job = {
        id: tempId,
        ...formData,
        createdAt: new Date().toISOString(),
        applicantCount: 0,
      };

      setJobs((prev) => [newJob, ...prev]);
      setIsModalOpen(false);

      try {
        const res = await createJobAction(formData);
        if (res.success && res.job) {
          setJobs((prev) =>
            prev.map((j) => (j.id === tempId ? res.job! : j))
          );
          toast.success("Job created", `"${formData.title}" is now open for applications.`);
        } else {
          setJobs((prev) => prev.filter((j) => j.id !== tempId));
          toast.error("Failed to create job", res.error || "Please try again.");
        }
      } catch {
        setJobs((prev) => prev.filter((j) => j.id !== tempId));
        toast.error("Network error", "Could not create job.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Toggle Close / Reopen status (optimistic)
  const handleToggleStatus = async (job: Job) => {
    const nextStatus: JobStatus = job.status === "open" ? "closed" : "open";
    const previous = [...jobs];

    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
    );

    try {
      const res = await updateJobAction(job.id, { status: nextStatus });
      if (!res.success) {
        setJobs(previous);
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "closed" ? "Job closed" : "Job reopened",
          `"${job.title}" marked as ${nextStatus}.`
        );
      }
    } catch {
      setJobs(previous);
      toast.error("Network error", "Could not update job status.");
    }
  };

  // Confirm Delete (optimistic)
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    const targetId = jobToDelete.id;
    const jobTitle = jobToDelete.title;
    const previous = [...jobs];

    setJobs((prev) => prev.filter((j) => j.id !== targetId));
    setJobToDelete(null);
    setIsDeleting(true);

    try {
      const res = await deleteJobAction(targetId);
      if (!res.success) {
        setJobs(previous);
        toast.error("Failed to delete job", res.error || "Please try again.");
      } else {
        toast.success("Job deleted", `"${jobTitle}" was removed.`);
      }
    } catch {
      setJobs(previous);
      toast.error("Network error", "Could not delete job.");
    } finally {
      setIsDeleting(false);
    }
  };

  // FilterBar configuration
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Jobs & Residencies
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Manage creative opportunities, fellowships, and studio commissions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Job
        </Button>
      </div>

      {/* FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search jobs by title, company, or location..."
        filters={filterConfigs}
        hasActiveFilters={Boolean(searchQuery) || statusFilter !== "all"}
        onResetFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setCurrentPage(1);
        }}
      >
        <span className="text-xs text-[#71716D]">
          {filteredJobs.length} {filteredJobs.length === 1 ? "opportunity" : "opportunities"}
        </span>
      </FilterBar>

      {/* Table of Jobs */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-5 h-5 text-[#8A8A85]" />}
          title="No jobs found"
          description={
            searchQuery || statusFilter !== "all"
              ? "No job matches your current filter criteria."
              : "No studio job postings have been created yet."
          }
          action={
            <Button variant="outline" size="sm" onClick={handleOpenCreateModal}>
              Post New Opportunity
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Opportunity</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Applicants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedJobs.map((job) => (
                <TableRow key={job.id}>
                  {/* Title */}
                  <TableCell>
                    <p className="font-medium text-[#141413]">{job.title}</p>
                    <p className="text-[11px] text-[#71716D]">ID: {job.id}</p>
                  </TableCell>

                  {/* Company */}
                  <TableCell className="text-[#52524E]">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#8A8A85] shrink-0" />
                      <span>{job.company}</span>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <span className="capitalize text-xs text-[#6E6E69] px-2 py-0.5 rounded border border-[#E8E8E3] bg-[#FAFAF8]">
                      {job.type}
                    </span>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A8A85] shrink-0" />
                      <span>{job.location}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={job.status === "open" ? "success" : "default"}
                      size="sm"
                      dot
                    >
                      {job.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </TableCell>

                  {/* Number of Applicants: links to Applications pre-filtered to that job */}
                  <TableCell className="text-center">
                    <Link
                      href={`/admin/applications?jobId=${job.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F5F5F0] hover:bg-[#F8EFEA] text-[#141413] hover:text-[#B8532F] border border-[#E8E8E3] hover:border-[#EACEC0] transition-colors"
                      title={`View ${job.applicantCount || 0} applications for ${job.title}`}
                    >
                      <Users className="w-3.5 h-3.5 text-[#71716D]" />
                      <span>{job.applicantCount || 0}</span>
                      <ExternalLink className="w-3 h-3 text-[#8A8A85]" />
                    </Link>
                  </TableCell>

                  {/* Actions: Edit, Close/Reopen, Delete */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(job)}
                        className="text-[#5E5E59] hover:text-[#141413]"
                        title="Edit Opportunity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(job)}
                        className={
                          job.status === "open"
                            ? "text-[#6E6E69] hover:text-[#B83838]"
                            : "text-[#28633B] hover:text-[#1F4F2F]"
                        }
                        title={job.status === "open" ? "Close Job" : "Reopen Job"}
                      >
                        {job.status === "open" ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setJobToDelete(job)}
                        className="text-[#8A8A85] hover:text-[#B83838]"
                        title="Delete Opportunity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredJobs.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* CREATE / EDIT JOB MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? "Edit Job Opportunity" : "Create New Job Opportunity"}
        description="Configure creative commission, fellowship, or studio opening."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveJob}
              isLoading={isSaving}
            >
              {editingJob ? "Save Changes" : "Post Opportunity"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveJob} className="space-y-4">
          <Input
            label="Job Title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            error={formErrors.title}
            placeholder="e.g. Master Sculptor in Residence"
            required
          />

          <Input
            label="Company / Studio"
            value={formData.company}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company: e.target.value }))
            }
            error={formErrors.company}
            placeholder="e.g. Atelier Kōra"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Opportunity Type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              options={[
                { label: "Contract", value: "contract" },
                { label: "Residency", value: "residency" },
                { label: "Full-Time", value: "full-time" },
                { label: "Part-Time", value: "part-time" },
                { label: "Fellowship", value: "fellowship" },
              ]}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as JobStatus,
                }))
              }
              options={[
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" },
              ]}
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            error={formErrors.location}
            placeholder="e.g. Kyoto / Remote"
            required
          />
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        title="Delete Job Opportunity"
        description="Permanently remove this opportunity listing."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJobToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#141413]">
              "{jobToDelete?.title}"
            </span>{" "}
            at {jobToDelete?.company}?
          </p>
          <p className="text-[11px] text-[#71716D]">
            All associated candidate application links will be closed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
