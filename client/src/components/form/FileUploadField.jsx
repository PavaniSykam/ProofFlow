import React, { useState } from 'react';
import { Upload, FileText, Trash2, Download, AlertCircle } from 'lucide-react';
import { uploadAttachment, deleteAttachment } from '../../api/requests';

export default function FileUploadField({
  requestId,
  field,
  attachments = [],
  onAttachmentChange,
  readOnly = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fieldAttachments = attachments.filter(
    (att) => att.fieldKey === field.key || (!att.fieldKey && attachments.length === 1)
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side extension validation
    const allowed = field.file?.allowedTypes || ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`File type ${ext} is not allowed. Supported: ${allowed.join(', ')}`);
      return;
    }

    // Client-side size validation
    const maxMB = field.file?.maxSizeMB || 5;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const res = await uploadAttachment(requestId, file, field.key);
      if (onAttachmentChange) {
        onAttachmentChange([...attachments, res.data.attachment]);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteAttachment(attId);
      if (onAttachmentChange) {
        onAttachmentChange(attachments.filter((a) => a._id !== attId));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete file');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </label>

      {field.helpText && (
        <p className="text-xs text-slate-500">{field.helpText}</p>
      )}

      {/* Upload button (only if not readOnly and limit not reached) */}
      {!readOnly && (
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{uploading ? 'Uploading...' : 'Choose File to Upload'}</span>
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="text-xs text-slate-400 ml-3">
            Max {field.file?.maxSizeMB || 5}MB (PDF, PNG, JPG, DOCX)
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {fieldAttachments.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {fieldAttachments.map((att) => (
            <div
              key={att._id}
              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{att.originalName}</span>
                <span className="text-xs text-slate-400">
                  ({(att.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/attachments/${att._id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white rounded"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
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
