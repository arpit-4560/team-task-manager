import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { TaskAttachment } from '../../lib/database.types';
import {
  Paperclip, Upload, Trash2, Download, Loader2,
  FileText, FileImage, FileVideo, File, X
} from 'lucide-react';

interface TaskAttachmentsProps {
  taskId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />;
  if (type.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-400" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-400" />;
  if (type.includes('word') || type.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
  if (type.includes('sheet') || type.includes('excel')) return <FileText className="w-5 h-5 text-green-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  async function fetchAttachments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*, uploader:profiles(id, full_name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (!error && data) setAttachments(data as TaskAttachment[]);
    setLoading(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 50 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 50MB limit.`);
        continue;
      }

      const ext = file.name.split('.').pop();
      const storagePath = `${user!.id}/${taskId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('task-attachments')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) {
        setError('Upload failed: ' + uploadErr.message);
        continue;
      }

      // Save record in DB
      const { error: dbErr } = await supabase.from('task_attachments').insert({
        task_id: taskId,
        uploaded_by: user!.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
      });

      if (dbErr) {
        setError('Failed to save attachment record: ' + dbErr.message);
        // Clean up the uploaded file
        await supabase.storage.from('task-attachments').remove([storagePath]);
        continue;
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchAttachments();
  }

  async function handleDownload(attachment: TaskAttachment) {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(attachment.storage_path, 60);

    if (error || !data) { setError('Could not generate download link.'); return; }

    // Preview images inline
    if (attachment.file_type.startsWith('image/')) {
      setPreview({ url: data.signedUrl, type: attachment.file_type, name: attachment.file_name });
      return;
    }

    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = attachment.file_name;
    a.target = '_blank';
    a.click();
  }

  async function handleDelete(attachment: TaskAttachment) {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return;
    setDeletingId(attachment.id);

    await supabase.storage.from('task-attachments').remove([attachment.storage_path]);
    await supabase.from('task_attachments').delete().eq('id', attachment.id);

    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    setDeletingId(null);
  }

  const canDelete = (att: TaskAttachment) => att.uploaded_by === user?.id;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments
          {attachments.length > 0 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
              {attachments.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 px-3 py-1.5 rounded-lg transition"
        >
          {uploading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading {uploadProgress}%</>
            : <><Upload className="w-3 h-3" /> Upload</>
          }
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
        />
      </div>

      {error && (
        <div className="mb-3 bg-red-900/30 border border-red-800 text-red-400 text-xs rounded-lg px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const dt = e.dataTransfer;
          if (dt.files.length > 0 && fileInputRef.current) {
            const input = fileInputRef.current;
            const changeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(changeEvent);
          }
        }}
        className={`border-2 border-dashed rounded-lg p-3 mb-3 text-center text-xs text-gray-500 transition ${uploading ? 'border-blue-700 bg-blue-900/10' : 'border-gray-700 hover:border-gray-600'}`}
      >
        {uploading
          ? <span className="text-blue-400">Uploading...</span>
          : 'Drag & drop files here or click Upload · Max 50MB'}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">No attachments yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 group">
              <FileIcon type={att.file_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{att.file_name}</p>
                <p className="text-xs text-gray-500">
                  {formatBytes(att.file_size)} · {formatDate(att.created_at)}
                  {att.uploader && <span> · {(att.uploader as any).full_name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleDownload(att)}
                  title={att.file_type.startsWith('image/') ? 'Preview' : 'Download'}
                  className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {canDelete(att) && (
                  <button
                    onClick={() => handleDelete(att)}
                    disabled={deletingId === att.id}
                    title="Delete"
                    className="p-1.5 hover:bg-red-900/40 rounded-lg text-gray-400 hover:text-red-400 transition"
                  >
                    {deletingId === att.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-3xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-gray-400 text-xs mb-2 text-center">{preview.name}</p>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
            <a
              href={preview.url}
              download={preview.name}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300"
            >
              <Download className="w-3 h-3" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
