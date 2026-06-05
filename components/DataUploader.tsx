"use client";

/**
 * CSV Data Uploader Component
 * 
 * Drag-and-drop file upload with Papa Parse CSV parsing.
 * Extracts schema metadata and displays column badges + sample data preview.
 */

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import { generateSchemaDoc, type SchemaDoc } from "@/lib/schema-generator";

interface DataUploaderProps {
  onDataLoaded: (
    data: Record<string, string>[],
    schemaDoc: SchemaDoc
  ) => void;
  currentFile?: string;
}

export default function DataUploader({ onDataLoaded, currentFile }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setError(null);
      setIsProcessing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessing(false);

          if (results.errors.length > 0) {
            const firstError = results.errors[0];
            setError(`CSV parse error at row ${firstError.row}: ${firstError.message}`);
            return;
          }

          const data = results.data as Record<string, string>[];
          if (data.length === 0) {
            setError("CSV file is empty or has no data rows");
            return;
          }

          const schema = generateSchemaDoc(file.name, data);
          onDataLoaded(data, schema);
        },
        error: (err) => {
          setIsProcessing(false);
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="data-uploader">
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""} ${currentFile ? "has-file" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="csv-upload-input"
        />

        {isProcessing ? (
          <div className="drop-zone-content">
            <div className="spinner" />
            <p>Processing CSV...</p>
          </div>
        ) : currentFile ? (
          <div className="drop-zone-content has-file">
            <FileSpreadsheet size={24} className="file-icon" />
            <p className="file-name">{currentFile}</p>
            <p className="file-hint">Click to replace</p>
          </div>
        ) : (
          <div className="drop-zone-content">
            <Upload size={28} className="upload-icon" />
            <p className="drop-label">Drop CSV here or click to browse</p>
            <p className="drop-hint">Max 10MB • Headers required</p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <X size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
