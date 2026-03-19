'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';

type SettingsMap = Record<string, string>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Failed to save');
      Swal.fire({
        icon: 'success',
        title: 'Setting Updated',
        text: `${key.replace('_', ' ')} has been saved successfully.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update setting' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10 space-y-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground">Manage global Madrasah information and branding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Basic Information */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              General Information
            </h2>
            <div className="grid gap-6">
               <div className="grid gap-2">
                 <label className="text-sm font-medium text-slate-700">Madrasah Name</label>
                 <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={settings.madrasah_name || ''} 
                      onChange={(e) => handleChange('madrasah_name', e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      placeholder="e.g. Madrasah Academic"
                   />
                   <button 
                     onClick={() => handleSave('madrasah_name', settings.madrasah_name)}
                     className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800"
                   >
                     Save
                   </button>
                 </div>
               </div>

               <div className="grid gap-2">
                 <label className="text-sm font-medium text-slate-700 leading-none">Complete Address</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                       <textarea 
                          rows={2}
                          value={settings.madrasah_address || ''} 
                          onChange={(e) => handleChange('madrasah_address', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                          placeholder="Madrasah Physical Location"
                       />
                    </div>
                    <button 
                     onClick={() => handleSave('madrasah_address', settings.madrasah_address)}
                     className="bg-slate-900 text-white px-4 h-[45px] rounded-xl text-xs font-bold hover:bg-slate-800 self-start"
                   >
                     Save
                   </button>
                 </div>
               </div>
            </div>
          </section>

          <section className="space-y-6 pt-4">
             <h2 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                       <input 
                          type="text" 
                          value={settings.madrasah_phone || ''} 
                          onChange={(e) => handleChange('madrasah_phone', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                       />
                    </div>
                    <button onClick={() => handleSave('madrasah_phone', settings.madrasah_phone)} className="bg-slate-100 p-2.5 rounded-lg hover:bg-slate-200"><Check className="h-4 w-4 text-slate-600" /></button>
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                       <input 
                          type="email" 
                          value={settings.madrasah_email || ''} 
                          onChange={(e) => handleChange('madrasah_email', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                       />
                    </div>
                    <button onClick={() => handleSave('madrasah_email', settings.madrasah_email)} className="bg-slate-100 p-2.5 rounded-lg hover:bg-slate-200"><Check className="h-4 w-4 text-slate-600" /></button>
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* Branding */}
        <div className="space-y-8">
           <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
             <h2 className="text-lg font-semibold flex items-center gap-2 leading-none">
                <ImageIcon className="h-4 w-4 text-primary" />
                Branding
             </h2>
             
             {/* Logo */}
             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Institutional Logo</label>
                <div className="group relative aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 transition-all hover:bg-slate-100 hover:border-primary/40">
                   {settings.madrasah_logo ? (
                     <img src={settings.madrasah_logo} alt="Logo" className="max-h-full object-contain" />
                   ) : (
                     <>
                        <ImageIcon className="h-10 w-10 text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter italic">Upload institutional logo</p>
                     </>
                   )}
                   <button className="absolute inset-0 flex items-center justify-center bg-primary/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                      <Upload className="h-5 w-5" />
                   </button>
                </div>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     className="flex-1 text-[10px] rounded-lg border border-slate-100 px-2 py-1 outline-none text-slate-400"
                     placeholder="Logo URL"
                     value={settings.madrasah_logo || ''}
                     onChange={(e) => handleChange('madrasah_logo', e.target.value)}
                   />
                   <button onClick={() => handleSave('madrasah_logo', settings.madrasah_logo)} className="text-xs font-bold text-primary hover:underline">Apply</button>
                </div>
             </div>

             {/* Favicon */}
             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Favicon (Small Icon)</label>
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      {settings.madrasah_favicon ? (
                        <img src={settings.madrasah_favicon} alt="favicon" className="h-6 w-6" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-200" />
                      )}
                   </div>
                   <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        className="w-full text-[10px] rounded-lg border border-slate-100 px-2 py-1 outline-none text-slate-400"
                        placeholder="Favicon URL"
                        value={settings.madrasah_favicon || ''}
                        onChange={(e) => handleChange('madrasah_favicon', e.target.value)}
                      />
                      <button onClick={() => handleSave('madrasah_favicon', settings.madrasah_favicon)} className="text-[10px] font-black text-primary uppercase tracking-widest">Apply Favicon</button>
                   </div>
                </div>
             </div>
           </section>

           <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-xs text-primary leading-relaxed">
                <strong>Tip:</strong> These settings are used for generating receipts, statements, and student reports. Always keep your contact information up to date.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
