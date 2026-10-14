"use client";

import React, { useState, useEffect, useRef } from "react";
import { Paperclip, UploadCloud, File, Trash2, Download, CheckCircle, AlertCircle } from "lucide-react";

interface AttachmentZoneProps {
  tableName: string;
  recordId: string;
  readOnly?: boolean;
}

export function AttachmentZone({ tableName, recordId, readOnly = false }: AttachmentZoneProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    if (!recordId || recordId === "new") return;
    try {
      setLoading(true);
      const res = await fetch(`/api/now/attachments?table=${tableName}&record_id=${recordId}`);
      const data = await res.json();
      if (data.result) setAttachments(data.result);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [tableName, recordId]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || readOnly) return;
    if (recordId === "new") {
      setErrorMsg("Please save this record before attaching files.");
      return;
    }

    setUploading(true);
    setErrorMsg("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await readFileAsBase64(file);
        const res = await fetch("/api/now/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableName,
            recordId,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            byteSize: file.size,
            base64Data: base64,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to upload file.");
      }
    }

    setUploading(false);
    fetchAttachments();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await fetch(`/api/now/attachments/${id}`, { method: "DELETE" });
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert("Failed to delete attachment: " + err.message);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const res = await fetch(`/api/now/attachments/${id}`);
      const data = await res.json();
      if (data.result?.base64Data) {
        const link = document.createElement("a");
        link.href = data.result.base64Data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      alert("Download error: " + err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span>Attachments ({attachments.length})</span>
        </label>
        {!readOnly && recordId !== "new" && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-3 py-1 rounded-full font-medium border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] transition-colors"
          >
            + Upload File
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Drop Zone */}
      {!readOnly && recordId !== "new" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[16px] p-4 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30"
              : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)]"
          }`}
        >
          <UploadCloud className="w-6 h-6 mx-auto mb-1 text-[var(--md-sys-color-on-surface-variant)]" />
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
            {uploading ? "Uploading files..." : "Drag and drop logs, screenshots, or documents here"}
          </p>
          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            or click to browse from device
          </p>
        </div>
      )}

      {/* List of Attachments */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-[12px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] shadow-xs"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary-container)] flex items-center justify-center text-[var(--md-sys-color-on-primary-container)] shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    {formatBytes(file.byteSize)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  title="Download attachment"
                  onClick={() => handleDownload(file.id, file.fileName)}
                  className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    title="Delete attachment"
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
