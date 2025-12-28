import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { StudioCard } from '@/components/dashboard/StudioCard';
import { CsvImportDialog } from '@/components/import/CsvImportDialog';
import { useRotations } from '@/hooks/useRotations';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [importOpen, setImportOpen] = useState(false);
  const { data: rotations, isLoading } = useRotations();

  return (
    <AppLayout>
      <Header 
        title="Dashboard Aksi" 
        subtitle="Tugas rotasi harian untuk semua studio"
        onUploadClick={() => setImportOpen(true)}
      />
      
      <div className="p-8">
        <StatsBar />
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Rotasi Hari Ini</h2>
          <p className="text-sm text-muted-foreground">
            Selesaikan penghapusan dan penambahan produk untuk setiap studio
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {rotations?.map((rotation) => (
              <StudioCard key={rotation.studio.id} rotation={rotation} />
            ))}
          </div>
        )}
      </div>

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </AppLayout>
  );
};

export default Index;
