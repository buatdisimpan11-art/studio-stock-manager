import { useState } from 'react';
import { Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudios, useCreateStudio, useUpdateStudio, useDeleteStudio } from '@/hooks/useStudios';
import { toast } from 'sonner';

const COLORS = [
  'hsl(168 84% 45%)',
  'hsl(258 90% 66%)',
  'hsl(330 80% 60%)',
  'hsl(38 92% 55%)',
  'hsl(200 90% 50%)',
  'hsl(15 80% 55%)',
  'hsl(280 70% 55%)',
  'hsl(120 60% 45%)',
];

const Settings = () => {
  const { data: studios, isLoading } = useStudios();
  const createStudio = useCreateStudio();
  const updateStudio = useUpdateStudio();
  const deleteStudio = useDeleteStudio();

  const [newStudio, setNewStudio] = useState({ name: '', category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddStudio = async () => {
    if (!newStudio.name || !newStudio.category) {
      toast.error('Mohon isi semua field');
      return;
    }

    const colorIndex = (studios?.length || 0) % COLORS.length;
    await createStudio.mutateAsync({
      name: newStudio.name,
      category: newStudio.category,
      color: COLORS[colorIndex],
    });
    setNewStudio({ name: '', category: '' });
  };

  const handleUpdateCapacity = async (id: string, capacity: number) => {
    await updateStudio.mutateAsync({ id, capacity });
    setEditingId(null);
  };

  const handleUpdateRotation = async (id: string, daily_rotation: number) => {
    await updateStudio.mutateAsync({ id, daily_rotation });
  };

  const handleDeleteStudio = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus studio ini? Semua produk di studio ini juga akan dihapus.')) {
      await deleteStudio.mutateAsync(id);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Pengaturan" 
        subtitle="Kelola studio dan konfigurasi"
      />
      
      <div className="p-8 max-w-4xl">
        {/* Add Studio */}
        <div className="mb-8 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tambah Studio Baru</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className="text-muted-foreground">Nama Studio</Label>
              <Input
                id="name"
                placeholder="cth: Studio 8"
                value={newStudio.name}
                onChange={(e) => setNewStudio({ ...newStudio, name: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-muted-foreground">Kategori</Label>
              <Input
                id="category"
                placeholder="cth: Aksesoris"
                value={newStudio.category}
                onChange={(e) => setNewStudio({ ...newStudio, category: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddStudio} 
                className="gap-2 bg-gradient-primary w-full"
                disabled={createStudio.isPending}
              >
                {createStudio.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Tambah Studio
              </Button>
            </div>
          </div>
        </div>

        {/* Studios List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Studio Aktif</h3>
            <p className="text-sm text-muted-foreground mt-1">Konfigurasi kapasitas dan pengaturan rotasi</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : studios?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Belum ada studio</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {studios?.map((studio) => (
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
                        <p className="text-xs text-muted-foreground">Kapasitas</p>
                        {editingId === studio.id ? (
                          <Input
                            type="number"
                            defaultValue={studio.capacity}
                            className="w-20 h-8 text-sm bg-secondary"
                            onBlur={(e) => handleUpdateCapacity(studio.id, parseInt(e.target.value))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateCapacity(studio.id, parseInt((e.target as HTMLInputElement).value));
                              }
                            }}
                            autoFocus
                          />
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
                        <p className="text-xs text-muted-foreground">Rotasi Harian</p>
                        <select
                          value={studio.daily_rotation}
                          onChange={(e) => handleUpdateRotation(studio.id, parseInt(e.target.value))}
                          className="bg-secondary text-foreground text-lg font-semibold border-none rounded px-2 py-1 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Aktif</p>
                        <p className="text-lg font-semibold text-primary">{studio.product_count}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteStudio(studio.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Algorithm Settings */}
        <div className="mt-8 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Pengaturan Algoritma</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">Bobot GMV (%)</Label>
              <Input
                type="number"
                defaultValue={70}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Bobot GMV dalam perhitungan skor</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Bobot Klik (%)</Label>
              <Input
                type="number"
                defaultValue={30}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Bobot klik dalam perhitungan skor</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Periode Cooldown (hari)</Label>
              <Input
                type="number"
                defaultValue={14}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Hari sebelum produk bisa kembali</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Strategi Pemilihan</Label>
              <select className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground">
                <option value="random">Acak</option>
                <option value="newest">Terbaru Ditambahkan</option>
                <option value="historical">Potensi Historis</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Cara memilih produk pengganti</p>
            </div>
          </div>
          <Button className="mt-6 gap-2 bg-gradient-primary">
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
