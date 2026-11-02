import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck2,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { DocumentRecord, DocumentChunk } from '../../types';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Chunk inspection drawer state
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(res.data.message || 'Documents successfully processed and indexed into ChromaDB.');
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to process document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? All corresponding vector embeddings will be permanently purged.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setChunks([]);
      }
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      const res = await api.post(`/documents/${docId}/reprocess`);
      alert(res.data.message || 'Document reprocessed successfully.');
      fetchDocuments();
    } catch (err) {
      alert('Failed to reprocess document.');
    }
  };

  const handleInspect = async (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await api.get(`/documents/${doc.id}`);
      setChunks(res.data.chunks || []);
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Knowledge Base & Document Store
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload PDFs, Word DOCX, and TXT files. Chunks are automatically embedded and saved into ChromaDB.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className="p-8 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-center hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {uploading ? 'Processing & Indexing Embeddings...' : 'Click or drag files here to upload'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports PDF, DOCX, and TXT files up to 15MB. Page numbers and metadata are extracted automatically.
        </p>

        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 animate-pulse w-3/4"></div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document List Header with Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">
          Showing <strong>{filteredDocs.length}</strong> of <strong>{documents.length}</strong> documents
        </p>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No documents found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Chunks Indexed</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          doc.file_status === 'ready'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : doc.file_status === 'failed'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {doc.file_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {doc.chunk_count} vector chunks
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleInspect(doc)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="View extracted chunks & page references"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                        title="Re-extract and re-index document"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 transition-colors"
                        title="Delete document and purge vector records"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chunk Breakdown Drawer / Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slideIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="overflow-hidden pr-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {selectedDoc.filename}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 font-semibold mt-0.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{chunks.length} Extracted Semantic Chunks</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingChunks ? (
                <div className="text-center py-12 text-xs text-slate-400">Loading chunk vectors...</div>
              ) : chunks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No chunks found for this document.</div>
              ) : (
                chunks.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Chunk #{c.chunk_index + 1}
                      </span>
                      <span>Page {c.page_number || 1} • {c.token_count || 0} tokens</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      {c.chunk_text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
