'use client';

import { useState } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Loader2, Upload, CheckCircle2, XCircle } from 'lucide-react';

interface ImageUploadProps {
  onSuccess: (url: string) => void;
  folder?: string;
  label?: string;
  currentValue?: string;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

const authenticator = async () => {
  try {
    const response = await fetch('/api/imagekit/auth');
    if (!response.ok) throw new Error('Failed to get auth params');
    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

export function ImageUpload({ onSuccess, folder = '/branding', label = 'Select Image', currentValue }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onError = (err: any) => {
    console.error('Upload error:', err);
    setError('Upload failed. Please try again.');
    setUploading(false);
  };

  const onUploadSuccess = (res: any) => {
    setUploading(false);
    onSuccess(res.url);
  };

  const onUploadStart = () => {
    setUploading(true);
    setError(null);
  };

  return (
    <IKContext
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <div className="space-y-3">
         <div className="relative group aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 transition-all hover:bg-slate-50 hover:border-primary/40 overflow-hidden">
            {currentValue ? (
               <img src={currentValue} alt="Preview" className="max-h-full object-contain" />
            ) : (
               <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-50 transition-opacity">
                  <Upload className="h-8 w-8 text-slate-900" />
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-tighter italic">No File Selected</p>
               </div>
            )}

            {uploading && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10 transition-all">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Uploading to Cloud...</p>
               </div>
            )}

            <div className={`absolute inset-0 flex items-center justify-center bg-primary/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
               <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
               </div>
               <IKUpload
                  fileName="branding_asset"
                  folder={folder}
                  useUniqueFileName={true}
                  onError={onError}
                  onSuccess={onUploadSuccess}
                  onUploadStart={onUploadStart}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
               />
            </div>
         </div>

         {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
               <XCircle className="h-3 w-3 text-rose-500" />
               <p className="text-[10px] font-bold text-rose-500 uppercase leading-none">{error}</p>
            </div>
         )}
      </div>
    </IKContext>
  );
}
