import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Link as LinkIcon, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [isDragging, setIsDragging] = useState(false);
  
  // Link Import State
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FILE UPLOAD LOGIC ---
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [onDataLoaded]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        onDataLoaded(data);
      } catch (e) {
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // --- LINK IMPORT LOGIC ---
  const handleUrlImport = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);

    let fetchUrl = url;

    // Google Sheets Helper: Try to convert standard Edit URL to CSV Export URL
    if (url.includes('docs.google.com/spreadsheets')) {
      // Extract ID
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          onDataLoaded(jsonData);
        } catch (parseError) {
          setError("Could not parse the data from the link. Ensure it is a valid CSV or Excel file.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(blob);

    } catch (err) {
      console.error(err);
      setError("Unable to access the link. Please ensure the Google Sheet is 'Public' or 'Published to Web', or providing a direct download link.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => { setActiveTab('file'); setError(null); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'file' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Upload File
        </button>
        <button 
          onClick={() => { setActiveTab('link'); setError(null); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'link' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Import from Link
        </button>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === 'file' ? (
          <div 
            className={`w-full py-12 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer relative group flex flex-col items-center justify-center ${
              isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
              : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input 
              type="file" 
              accept=".xlsx, .csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            
            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
               <UploadCloud className="w-8 h-8 text-blue-600" strokeWidth={2} />
            </div>
            
            <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800">Drag & Drop</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">or click to browse Excel/CSV</p>
            </div>

            <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>.XLSX</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>.CSV</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  <strong>Supported:</strong> Public Google Sheets or Direct Download Links (Shimo/Excel). 
                  <br />For Google Sheets, ensure "Anyone with the link" is set to viewer.
                </p>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Paste Sheet Link</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
             </div>

             {error && (
               <p className="text-xs text-red-500 font-medium ml-1 animate-fade-in">{error}</p>
             )}

             <button 
                onClick={handleUrlImport}
                disabled={!url || isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm mt-2
                  ${!url || isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
             >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Import Data <ArrowRight className="w-4 h-4" />
                  </>
                )}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
