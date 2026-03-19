'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings2, 
  Layers, 
  Trash2, 
  PlusCircle, 
  Briefcase,
  Loader2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Layout
} from 'lucide-react';
import Swal from 'sweetalert2';

type Component = { id: string; name: string; type: 'EARNING' | 'DEDUCTION'; description?: string };
type Template = { id: string; name: string; components: { component: Component; amount: string }[] };

export default function SalaryConfigPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCompModal, setShowCompModal] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/salary-components'),
        fetch('/api/salary-templates')
      ]);
      setComponents(await cRes.json());
      setTemplates(await tRes.json());
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      type: (form.elements.namedItem('type') as HTMLSelectElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value
    };
    try {
      await fetch('/api/salary-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setShowCompModal(false);
      fetchAll();
      Swal.fire({ icon: 'success', title: 'Component Defined', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire('Error', 'Failed to create component', 'error');
    }
  };

  const [tempData, setTempData] = useState({ name: '', items: [] as { componentId: string; amount: number }[] });

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/salary-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempData.name,
          components: tempData.items
        })
      });
      if (!res.ok) throw new Error('Failed');
      setShowTempModal(false);
      setTempData({ name: '', items: [] });
      fetchAll();
      Swal.fire({ icon: 'success', title: 'Template Created', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire('Error', 'Failed to create template', 'error');
    }
  };

  const addCompToTemp = (id: string) => {
    if (tempData.items.some(i => i.componentId === id)) return;
    setTempData(prev => ({ ...prev, items: [...prev.items, { componentId: id, amount: 0 }] }));
  };

  const updateTempCompAmount = (id: string, amount: number) => {
    setTempData(prev => ({
      ...prev,
      items: prev.items.map(i => i.componentId === id ? { ...i, amount } : i)
    }));
  };

  const removeCompFromTemp = (id: string) => {
    setTempData(prev => ({ ...prev, items: prev.items.filter(i => i.componentId !== id) }));
  };

  return (
    <div className="p-6 md:p-10 space-y-12 min-h-screen bg-slate-50/50 italic-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
            <Settings2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Salary Structure</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Remuneration Blueprint</p>
          </div>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={() => setShowCompModal(true)}
             className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
           >
             <Briefcase className="h-4 w-4" />
             Define Component
           </button>
           <button 
             onClick={() => setShowTempModal(true)}
             className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
           >
             <Layout className="h-4 w-4" />
             Create Template
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
         {/* Components Section */}
         <section className="space-y-8">
            <div className="flex items-center gap-3">
               <Layers className="h-5 w-5 text-indigo-500" />
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Components</h2>
            </div>

            <div className="space-y-4">
               {components.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                     <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-[1.25rem] flex items-center justify-center ${
                           c.type === 'EARNING' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                           {c.type === 'EARNING' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.type}</p>
                        </div>
                     </div>
                     <button className="p-3 text-slate-200 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-5 w-5" />
                     </button>
                  </div>
               ))}
               {components.length === 0 && <p className="text-slate-300 text-xs font-bold uppercase tracking-widest text-center py-10 opacity-50">No components defined</p>}
            </div>
         </section>

         {/* Templates Section */}
         <section className="space-y-8">
            <div className="flex items-center gap-3">
               <Layout className="h-5 w-5 text-indigo-500" />
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Templates</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {templates.map(t => (
                  <div key={t.id} className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 text-white space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black italic tracking-tighter uppercase">{t.name}</h3>
                        <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                           {t.components.length} Items
                        </span>
                     </div>
                     <div className="space-y-2">
                        {t.components.map((tc, idx) => (
                           <div key={idx} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest bg-white/5 p-3 rounded-xl border border-white/5">
                              <span className="text-slate-400">{tc.component.name}</span>
                              <span className={tc.component.type === 'EARNING' ? 'text-emerald-400' : 'text-rose-400'}>
                                 {tc.component.type === 'EARNING' ? '+' : '-'} KES {tc.amount}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
               {templates.length === 0 && <p className="text-slate-300 text-xs font-bold uppercase tracking-widest text-center py-10 opacity-50">No templates defined</p>}
            </div>
         </section>
      </div>

      {/* Component Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none mb-2">Build Component</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Define Pay Element Nature</p>
                 </div>
                 <button onClick={() => setShowCompModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <XCircle className="h-8 w-8" />
                 </button>
              </div>

              <form onSubmit={handleCreateComponent} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Component Identity</label>
                    <input name="name" required className="w-full bg-slate-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-slate-300" placeholder="e.g. Housing Allowance" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Operational Nature</label>
                    <select name="type" className="w-full bg-slate-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all">
                       <option value="EARNING">EARNING (+)</option>
                       <option value="DEDUCTION">DEDUCTION (-)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Formal Description</label>
                    <textarea name="description" className="w-full bg-slate-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all min-h-[100px]" placeholder="..." />
                 </div>
                 <button type="submit" className="w-full bg-slate-900 px-8 py-5 rounded-[2rem] text-xs font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl active:scale-95">
                    Forge Component
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Template Modal */}
      {showTempModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto italic-none">
           <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 my-auto animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none mb-2">Architect Template</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Construct Master Pay Package</p>
                 </div>
                 <button onClick={() => setShowTempModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <XCircle className="h-8 w-8" />
                 </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Template Name</label>
                    <input 
                      required
                      value={tempData.name}
                      onChange={e => setTempData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-slate-300"
                      placeholder="e.g. Standard Teacher Grade 1" 
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Components & Amounts</label>
                       <div className="relative group">
                          <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                             <PlusCircle className="h-3 w-3" /> Add Component
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 hidden group-hover:block z-50">
                             {components.map(c => (
                                <button 
                                  key={c.id}
                                  type="button"
                                  onClick={() => addCompToTemp(c.id)}
                                  className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 rounded-xl flex items-center justify-between"
                                >
                                   {c.name}
                                   <span className="text-[8px] opacity-40">{c.type}</span>
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {tempData.items.map(item => {
                         const comp = components.find(c => c.id === item.componentId);
                         return (
                           <div key={item.componentId} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${comp?.type === 'EARNING' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {comp?.type === 'EARNING' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                 </div>
                                 <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{comp?.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">KES</span>
                                    <input 
                                      type="number"
                                      value={item.amount}
                                      onChange={e => updateTempCompAmount(item.componentId, Number(e.target.value))}
                                      className="w-28 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-black outline-none focus:ring-2 ring-indigo-600/20"
                                    />
                                 </div>
                                 <button type="button" onClick={() => removeCompFromTemp(item.componentId)} className="text-slate-300 hover:text-rose-600 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                 </button>
                              </div>
                           </div>
                         );
                       })}
                       {tempData.items.length === 0 && (
                         <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No components added yet</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-slate-900 px-8 py-5 rounded-[2rem] text-xs font-black text-white uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">
                    Forge Template
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
