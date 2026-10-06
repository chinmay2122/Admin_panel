"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  UploadCloud,
  ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  User as UserIcon,
  Loader2,
  RefreshCw,
  Trash2,
  Layers,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Check,
  ChevronDown,
} from "lucide-react";
import { Artwork, ArtworkStatus, Creator } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui";
import {
  createArtworkAction,
  uploadArtworkMediaAction,
  deleteArtworkMediaAction,
} from "@/app/admin/actions";

export interface ArtworkUploadFormProps {
  mode?: "admin" | "creator";
  creators?: Creator[];
  defaultCreatorId?: string;
  defaultCreatorName?: string;
  onSuccess?: (artwork: Artwork) => void;
  onCancel?: () => void;
}

const MEDIUM_PRESETS = [
  "Painting",
  "Sculpture",
  "Cast Bronze",
  "Photography",
  "Digital Art",
  "Ceramic",
  "Mixed Media",
  "Printmaking",
  "Textile",
  "Diffused Glass",
  "Installation",
];

const AVAILABILITY_OPTIONS = [
  "Available",
  "For Sale",
  "Not for sale",
  "Sold",
];

const PRICE_VISIBILITY_OPTIONS = [
  { value: "Show Price", label: "Show Price" },
  { value: "Price on Request", label: "Price on Request" },
  { value: "Hide Price", label: "Hide Price" },
];

const ALLOWED_EXTENSIONS = ["PNG", "JPG", "JPEG", "WEBP"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string): string {
  if (!name) return "CR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ArtworkUploadForm({
  mode = "admin",
  creators = [],
  defaultCreatorId = "",
  defaultCreatorName = "",
  onSuccess,
  onCancel,
}: ArtworkUploadFormProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState(defaultCreatorId);
  const [selectedCreatorName, setSelectedCreatorName] = useState(defaultCreatorName);
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);

  const [medium, setMedium] = useState("Painting");
  const [customMedium, setCustomMedium] = useState("");
  const [isCustomMedium, setIsCustomMedium] = useState(false);

  const [dimensions, setDimensions] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [location, setLocation] = useState("");
  const [collection, setCollection] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceVisibility, setPriceVisibility] = useState("Show Price");
  const [availability, setAvailability] = useState("Available");
  const [status, setStatus] = useState<ArtworkStatus>("published");

  // Media Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sync creator if default provided
  useEffect(() => {
    if (defaultCreatorId && !selectedCreatorId) {
      setSelectedCreatorId(defaultCreatorId);
    }
    if (defaultCreatorName && !selectedCreatorName) {
      setSelectedCreatorName(defaultCreatorName);
    }
  }, [defaultCreatorId, defaultCreatorName, selectedCreatorId, selectedCreatorName]);

  // Filter creators for searchable dropdown
  const filteredCreators = useMemo(() => {
    if (!creatorSearchQuery.trim()) return creators;
    const q = creatorSearchQuery.toLowerCase().trim();
    return creators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.discipline && c.discipline.toLowerCase().includes(q))
    );
  }, [creators, creatorSearchQuery]);

  // Currently selected creator object
  const activeCreator = useMemo(() => {
    return creators.find((c) => c.id === selectedCreatorId) || null;
  }, [creators, selectedCreatorId]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate File
  const handleFileValidation = (file: File): boolean => {
    const nextErrors = { ...validationErrors };
    delete nextErrors.file;

    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toUpperCase() : "";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      nextErrors.file = `Unsupported format (.${ext || "file"}). Supported formats: PNG, JPG, JPEG, WEBP.`;
      setValidationErrors(nextErrors);
      toast.error("Invalid file format", nextErrors.file);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      nextErrors.file = `File size (${formatFileSize(file.size)}) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`;
      setValidationErrors(nextErrors);
      toast.error("File too large", nextErrors.file);
      return false;
    }

    setValidationErrors(nextErrors);
    return true;
  };

  // Handle File Change
  const handleFileSelect = (file: File) => {
    if (!handleFileValidation(file)) return;

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadProgress(100);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveMedia = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Artwork title is required.";
    }

    if (mode === "admin" && !selectedCreatorId && !selectedCreatorName.trim()) {
      errors.creator = "Please select or specify a creator for this artwork.";
    }

    if (!selectedFile && !previewUrl) {
      errors.file = "Please upload an artwork image.";
    }

    const finalMedium = isCustomMedium ? customMedium.trim() : medium;
    if (!finalMedium) {
      errors.medium = "Please specify a medium / category.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Validation Error", "Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    let uploadedFilePath: string | undefined;

    try {
      let finalImageUrl = previewUrl || "";

      // Step 1: Upload media file to Supabase storage bucket `artworks`
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(30);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("creatorId", selectedCreatorId || "admin-curated");

        const uploadRes = await uploadArtworkMediaAction(formData);
        setUploadProgress(80);

        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || "Media upload to storage failed.");
        }

        finalImageUrl = uploadRes.url;
        uploadedFilePath = uploadRes.filePath;
        setUploadProgress(100);
        setIsUploading(false);
      }

      // Step 2: Create Artwork Record via backend action
      const effectiveCreatorName =
        selectedCreatorName.trim() || activeCreator?.name || "Unknown Artist";

      const numericPrice = price.trim() ? parseFloat(price) : 0;

      const payload = {
        title: title.trim(),
        creatorId: selectedCreatorId || undefined,
        creatorName: effectiveCreatorName,
        medium: finalMedium,
        dimensions: dimensions.trim() || "Dimensions on request",
        price: isNaN(numericPrice) ? 0 : numericPrice,
        imageUrl: finalImageUrl,
        status,
        year: year.trim() || new Date().getFullYear().toString(),
        location: location.trim() || undefined,
        collection: collection.trim() || undefined,
        description: description.trim() || undefined,
        priceVisibility,
        availability,
      };

      const res = await createArtworkAction(payload);

      if (!res.success || !res.artwork) {
        // Rollback uploaded file if DB insert fails
        if (uploadedFilePath) {
          await deleteArtworkMediaAction(uploadedFilePath).catch(() => {});
        }
        throw new Error(res.error || "Failed to persist artwork in catalog.");
      }

      toast.success(
        "Artwork Created",
        `"${res.artwork.title}" by ${res.artwork.creatorName} has been created successfully.`
      );

      if (onSuccess) {
        onSuccess(res.artwork);
      }
    } catch (err: any) {
      console.error("Artwork upload error:", err);
      toast.error("Creation Failed", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-[#141413]">
      {/* ===================================================================== */}
      {/* 1. MEDIA UPLOAD (EXACT CREATOR DRAG & DROP EXPERIENCE)                 */}
      {/* ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#141413]">
            Artwork Media <span className="text-[#B83838]">*</span>
          </label>
          <span className="text-[11px] text-[#71716D]">
            Max file size: {MAX_FILE_SIZE_MB}MB (PNG, JPG, JPEG, WEBP)
          </span>
        </div>

        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
              isDragging
                ? "border-[#B8532F] bg-[#FAF5F0]"
                : validationErrors.file
                ? "border-[#F2C6C6] bg-[#FDF5F5]"
                : "border-[#D5D3CE] bg-[#FAFAF8] hover:border-[#8A8A85] hover:bg-[#F5F4F0]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#52524E] mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6 text-[#B8532F]" />
            </div>

            <p className="text-sm font-medium text-[#141413] mb-1">
              Drag and drop your artwork image here
            </p>
            <p className="text-xs text-[#71716D] mb-3">
              High-resolution primary exhibition image for catalogue discovery
            </p>

            <button
              type="button"
              className="px-4 py-1.5 rounded-full border border-[#D5D3CE] bg-white text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors shadow-2xs cursor-pointer select-none"
            >
              Browse Files
            </button>
          </div>
        ) : (
          /* Preview Card with Upload Progress & Controls */
          <div className="relative border border-[#E8E8E3] bg-[#FAFAF8] rounded-xl p-4 overflow-hidden space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Image Preview Container */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-[#EFECE6] border border-[#E8E8E3] shrink-0 shadow-2xs">
                <img
                  src={previewUrl}
                  alt="Artwork upload preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File Info & Upload Status */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[#141413] truncate">
                    {selectedFile ? selectedFile.name : "Uploaded Artwork Media"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF2EC] text-[#28633B] border border-[#D4E6D8]">
                    <CheckCircle2 className="w-3 h-3 text-[#28633B]" />
                    Ready
                  </span>
                </div>

                <p className="text-[11px] text-[#71716D]">
                  {selectedFile ? formatFileSize(selectedFile.size) : "Ready for submission"} • Primary Catalog Asset
                </p>

                {/* Simulated / Real Upload Progress */}
                {isUploading && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-[#71716D]">
                      <span>Uploading to Supabase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E8E8E3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B8532F] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions: Replace / Remove */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium text-[#52524E] hover:text-[#141413] bg-white border border-[#D5D3CE] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium text-[#B83838] hover:bg-[#FDF2F2] border border-[#F4CDCD] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {validationErrors.file && (
          <p className="text-[11px] text-[#B83838] flex items-center gap-1 pt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {validationErrors.file}
          </p>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. ADMIN ONLY: SEARCHABLE CREATOR SELECTOR                            */}
      {/* ===================================================================== */}
      {mode === "admin" && (
        <div className="space-y-2 p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6E1]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#141413]">
              Creator / Artist <span className="text-[#B83838]">*</span>
            </label>
            <span className="text-[11px] text-[#71716D]">
              Assign this artwork to a registered creator account
            </span>
          </div>

          {activeCreator || selectedCreatorName ? (
            /* Selected Creator Card */
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E8E8E3] shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EFECE6] border border-[#D5D3CE] text-[#141413] flex items-center justify-center font-semibold text-xs shrink-0">
                  {getInitials(activeCreator?.name || selectedCreatorName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs text-[#141413]">
                      {activeCreator?.name || selectedCreatorName}
                    </p>
                    {activeCreator?.plan && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-medium bg-[#E8E8E3] text-[#52524E]">
                        {activeCreator.plan}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71716D]">
                    {activeCreator?.email || activeCreator?.discipline || "Registered Creator"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCreatorId("");
                  setSelectedCreatorName("");
                  setIsCreatorDropdownOpen(true);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-medium text-[#71716D] hover:text-[#141413] hover:bg-[#F5F4F0] border border-transparent hover:border-[#D5D3CE] transition-colors cursor-pointer"
              >
                Change Creator
              </button>
            </div>
          ) : (
            /* Search & Creator Selector Dropdown */
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A85]" />
                <input
                  type="text"
                  placeholder="Search creator by name, email, or discipline..."
                  value={creatorSearchQuery}
                  onChange={(e) => {
                    setCreatorSearchQuery(e.target.value);
                    setIsCreatorDropdownOpen(true);
                  }}
                  onFocus={() => setIsCreatorDropdownOpen(true)}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E8E8E3] bg-white text-xs text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
                />
                {creatorSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCreatorSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isCreatorDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg bg-white border border-[#E8E8E3] shadow-lg divide-y divide-[#F5F5F0]">
                  {filteredCreators.length > 0 ? (
                    filteredCreators.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCreatorId(c.id);
                          setSelectedCreatorName(c.name);
                          setIsCreatorDropdownOpen(false);
                          setCreatorSearchQuery("");
                          const nextErr = { ...validationErrors };
                          delete nextErr.creator;
                          setValidationErrors(nextErr);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FAF9F5] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#EFECE6] text-[#141413] flex items-center justify-center font-semibold text-[10px] shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-[#141413] truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[#71716D] truncate">
                              {c.email || c.discipline || "Creator"}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-[#B8532F] font-medium shrink-0">
                          Select →
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[11px] text-[#71716D]">
                      No creators found matching "{creatorSearchQuery}".
                      {creatorSearchQuery.trim() && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCreatorName(creatorSearchQuery.trim());
                              setIsCreatorDropdownOpen(false);
                            }}
                            className="text-[#B8532F] font-medium underline"
                          >
                            Use "{creatorSearchQuery.trim()}" as custom creator name
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {validationErrors.creator && (
            <p className="text-[11px] text-[#B83838] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {validationErrors.creator}
            </p>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ARTWORK METADATA (EXACT FIELDS AS CREATOR PLATFORM)                */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85] border-b border-[#E8E8E3] pb-1.5">
          Artwork Information
        </h4>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[#141413] mb-1">
            Artwork Title <span className="text-[#B83838]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Monsoon Studies No. 4"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors.title) {
                const next = { ...validationErrors };
                delete next.title;
                setValidationErrors(next);
              }
            }}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
          />
          {validationErrors.title && (
            <p className="text-[11px] text-[#B83838] mt-1">{validationErrors.title}</p>
          )}
        </div>

        {/* Medium & Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Primary Medium / Category <span className="text-[#B83838]">*</span>
            </label>
            {!isCustomMedium ? (
              <div className="flex gap-2">
                <select
                  value={medium}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomMedium(true);
                    } else {
                      setMedium(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
                >
                  {MEDIUM_PRESETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="custom">+ Add Custom Medium...</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Cast Bronze & Transducer"
                  value={customMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomMedium(false)}
                  className="px-2 py-2 text-xs text-[#71716D] hover:text-[#141413] border border-[#E8E8E3] rounded-lg bg-white"
                  title="Choose from list"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Physical Dimensions
            </label>
            <input
              type="text"
              placeholder="e.g. 80 × 100 cm or 120 × 85 × 40 cm"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>
        </div>

        {/* Year, Location & Collection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Year of Creation
            </label>
            <input
              type="text"
              placeholder="e.g. 2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Studio / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Tokyo, Berlin"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Collection / Series
            </label>
            <input
              type="text"
              placeholder="e.g. Monsoon Studies"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F]"
            />
          </div>
        </div>

        {/* Description / Curatorial Statement */}
        <div>
          <label className="block text-xs font-medium text-[#141413] mb-1">
            Curatorial Statement / Description
          </label>
          <textarea
            rows={3}
            placeholder="A study of changing light across urban landscapes. Layered forms reveal fragments of memory..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] resize-none"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. PRICING, AVAILABILITY & PUBLICATION STATUS                         */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85] border-b border-[#E8E8E3] pb-1.5">
          Commercial Terms & Publication
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A85] font-medium">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="6800"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
              />
            </div>
          </div>

          {/* Price Visibility */}
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Price Display Setting
            </label>
            <select
              value={priceVisibility}
              onChange={(e) => setPriceVisibility(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
            >
              {PRICE_VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Catalog Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Publication Status Selector */}
        <div>
          <label className="block text-xs font-medium text-[#141413] mb-1">
            Publication Status
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                value: "published",
                label: "Published",
                desc: "Immediately live in exhibition discovery",
                color: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
              },
              {
                value: "pending",
                label: "Pending Review",
                desc: "Queued for curatorial appraisal",
                color: "border-amber-200 bg-amber-50/50 text-amber-800",
              },
              {
                value: "draft",
                label: "Draft",
                desc: "Unlisted, internal studio catalog only",
                color: "border-neutral-200 bg-neutral-50/50 text-neutral-800",
              },
            ].map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatus(st.value as ArtworkStatus)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  status === st.value
                    ? `${st.color} ring-1 ring-[#B8532F] font-medium`
                    : "border-[#E8E8E3] bg-white text-[#52524E] hover:bg-[#FAF9F5]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs">{st.label}</span>
                  {status === st.value && (
                    <Check className="w-3.5 h-3.5 text-[#B8532F]" />
                  )}
                </div>
                <p className="text-[10px] text-[#71716D] leading-tight">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. FORM FOOTER & ACTIONS                                              */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8E8E3]">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="min-w-[140px]"
        >
          {isUploading ? (
            "Uploading Media..."
          ) : isSubmitting ? (
            "Creating Artwork..."
          ) : (
            "Publish Artwork"
          )}
        </Button>
      </div>
    </form>
  );
}
