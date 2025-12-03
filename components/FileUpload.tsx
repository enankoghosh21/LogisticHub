import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, ArrowUp } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [onDataLoaded]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      onDataLoaded(data);
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

  return (
    <div 
      className={`w-full max-w-xl mx-auto p-10 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer relative group ${
        isDragging 
        ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50 hover:shadow-lg'
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
      
      <div className="flex flex-col items-center justify-center space-y-5 relative z-10 pointer-events-none">
        <div className={`p-5 rounded-full shadow-lg transition-all duration-300 ${isDragging ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 group-hover:scale-110'}`}>
           <UploadCloud className="w-8 h-8" strokeWidth={2.5} />
        </div>
        
        <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">Upload Data Sheet</h3>
            <p className="text-sm text-gray-500 mt-2 font-medium">Drag & drop or click to browse</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-gray-400 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>.XLSX</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <span>.CSV</span>
        </div>
      </div>
    </div>
  );
};