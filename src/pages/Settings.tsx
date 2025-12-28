import { useState } from 'react';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { studios as initialStudios } from '@/data/mockData';
import { Studio } from '@/types';
import { toast } from 'sonner';

const Settings = () => {
  const [studios, setStudios] = useState<Studio[]>(initialStudios);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStudio, setNewStudio] = useState({ name: '', category: '' });

  const handleAddStudio = () => {
    if (!newStudio.name || !newStudio.category) {
      toast.error('Please fill in all fields');
      return;
    }

    const studio: Studio = {
      id: `studio-${studios.length + 1}`,
      name: newStudio.name,
      category: newStudio.category,
      capacity: 100,
      dailyRotation: 2,
      activeProducts: 0,
      color: `hsl(${Math.random() * 360} 70% 50%)`,
    };

    setStudios([...studios, studio]);
    setNewStudio({ name: '', category: '' });
    toast.success('Studio added successfully!');
  };

  const handleUpdateCapacity = (id: string, capacity: number) => {
    setStudios(studios.map(s => s.id === id ? { ...s, capacity } : s));
    toast.success('Capacity updated!');
    setEditingId(null);
  };

  const handleUpdateRotation = (id: string, rotation: number) => {
    setStudios(studios.map(s => s.id === id ? { ...s, dailyRotation: rotation } : s));
    toast.success('Daily rotation updated!');
  };

  return (
    <AppLayout>
      <Header 
        title="Settings" 
        subtitle="Manage studios and configurations"
      />
      
      <div className="p-8 max-w-4xl">
        {/* Add Studio */}
        <div className="mb-8 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Studio</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className="text-muted-foreground">Studio Name</Label>
              <Input
                id="name"
                placeholder="e.g., Studio 8"
                value={newStudio.name}
                onChange={(e) => setNewStudio({ ...newStudio, name: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-muted-foreground">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Accessories"
                value={newStudio.category}
                onChange={(e) => setNewStudio({ ...newStudio, category: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddStudio} className="gap-2 bg-gradient-primary w-full">
                <Plus className="w-4 h-4" />
                Add Studio
              </Button>
            </div>
          </div>
        </div>

        {/* Studios List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Active Studios</h3>
            <p className="text-sm text-muted-foreground mt-1">Configure capacity and rotation settings</p>
          </div>
          
          <div className="divide-y divide-border">
            {studios.map((studio) => (
              <div key={studio.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: studio.color }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{studio.name}</p>
                      <p className="text-sm text-muted-foreground">{studio.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      {editingId === studio.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={studio.capacity}
                            className="w-20 h-8 text-sm bg-secondary"
                            onBlur={(e) => handleUpdateCapacity(studio.id, parseInt(e.target.value))}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(studio.id)}
                          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {studio.capacity}
                        </button>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Daily Rotation</p>
                      <select
                        value={studio.dailyRotation}
                        onChange={(e) => handleUpdateRotation(studio.id, parseInt(e.target.value))}
                        className="bg-secondary text-foreground text-lg font-semibold border-none rounded px-2 py-1 cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-lg font-semibold text-primary">{studio.activeProducts}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Settings */}
        <div className="mt-8 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Algorithm Settings</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">GMV Weight (%)</Label>
              <Input
                type="number"
                defaultValue={70}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Weight for GMV in score calculation</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Clicks Weight (%)</Label>
              <Input
                type="number"
                defaultValue={30}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Weight for clicks in score calculation</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Cooldown Period (days)</Label>
              <Input
                type="number"
                defaultValue={14}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Days before removed product can return</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Selection Strategy</Label>
              <select className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground">
                <option value="random">Random</option>
                <option value="newest">Newest Added</option>
                <option value="historical">Historical Potential</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">How to select replacement products</p>
            </div>
          </div>
          <Button className="mt-6 gap-2 bg-gradient-primary">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
