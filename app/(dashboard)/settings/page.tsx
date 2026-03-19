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
import { ImageUpload } from '@/components/ui/image-upload';

type SettingsMap = Record<string, string>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: SettingsMap = {};
          // Standardize everything to a map
          data.forEach(s => map[s.key] = s.value);
          
          // Fallback logic for legacy keys
          if (!map.name && map.madrasah_name) map.name = map.madrasah_name;
          if (!map.address && map.madrasah_address) map.address = map.madrasah_address;
          if (!map.phone && map.madrasah_phone) map.phone = map.madrasah_phone;
          if (!map.email && map.madrasah_email) map.email = map.madrasah_email;
          if (!map.logo && map.madrasah_logo) map.logo = map.madrasah_logo;
          if (!map.favicon && map.madrasah_favicon) map.favicon = map.madrasah_favicon;
          
          setSettings(map);
        } else {
          setSettings(data);
        }
      })
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
      
      // Update local state for immediate preview
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Propagate change system-wide
      window.dispatchEvent(new CustomEvent('branding-update'));

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
                      value={settings.name || ''} 
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={(e) => handleSave('name', e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      placeholder="e.g. Madrasah Academic"
                   />
                 </div>
               </div>

               <div className="grid gap-2">
                 <label className="text-sm font-medium text-slate-700 leading-none">Complete Address</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                       <textarea 
                          rows={2}
                          value={settings.address || ''} 
                          onChange={(e) => handleChange('address', e.target.value)}
                          onBlur={(e) => handleSave('address', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                          placeholder="Madrasah Physical Location"
                       />
                    </div>
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
                          value={settings.phone || ''} 
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={(e) => handleSave('phone', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                       />
                    </div>
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                       <input 
                          type="email" 
                          value={settings.email || ''} 
                          onChange={(e) => handleChange('email', e.target.value)}
                          onBlur={(e) => handleSave('email', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                       />
                    </div>
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
                <ImageUpload 
                  label="Select Logo"
                  currentValue={settings.logo}
                  onSuccess={(url) => handleSave('logo', url)}
                  folder="/branding/logo"
                />
                <p className="text-[10px] text-slate-400 italic">Recommended: 512x512px PNG/SVG</p>
             </div>

             {/* Favicon */}
             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Favicon (Small Icon)</label>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <ImageUpload 
                        label="Select Favicon"
                        currentValue={settings.favicon}
                        onSuccess={(url) => handleSave('favicon', url)}
                        folder="/branding/favicon"
                      />
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">Recommended: 32x32px .ico or .png</p>
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
