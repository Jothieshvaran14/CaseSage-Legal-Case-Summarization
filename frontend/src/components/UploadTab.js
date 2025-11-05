import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UploadTab = ({ onDocumentUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      
      setUploadProgress(40);
      
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadProgress(100);
      setExtractedText(response.data.extracted_text);
      toast.success('Document uploaded and processed successfully!');
      
      onDocumentUploaded({
        document_id: response.data.document_id,
        filename: response.data.filename,
        extracted_text: response.data.extracted_text
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="upload-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Legal Document
          </CardTitle>
          <CardDescription className="text-slate-300">
            Upload PDF, DOCX, TXT, or image files (JPG, PNG) for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive ? 'border-amber-400 bg-amber-500/10' : 'border-white/20 hover:border-amber-400/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            data-testid="drop-zone"
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              data-testid="file-input"
            />
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-amber-500/20 rounded-full">
                  <FileText className="w-8 h-8 text-amber-400" />
                </div>
                
                {file ? (
                  <div className="space-y-2">
                    <p className="text-white font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white font-medium">Drop your file here or click to browse</p>
                    <p className="text-sm text-slate-400">
                      Supported: PDF, DOCX, TXT, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {uploading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Processing document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold transition-all"
            data-testid="btn-upload"
          >
            {uploading ? 'Processing...' : 'Upload & Extract Text'}
          </Button>
        </CardContent>
      </Card>

      {extractedText && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="preview-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Text Preview
            </CardTitle>
            <CardDescription className="text-slate-300">
              Extracted text from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono">
                {extractedText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadTab;
