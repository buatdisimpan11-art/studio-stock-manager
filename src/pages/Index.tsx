import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { StudioCard } from '@/components/dashboard/StudioCard';
import { getStudioRotations } from '@/data/mockData';

const Index = () => {
  const rotations = getStudioRotations();

  return (
    <AppLayout>
      <Header 
        title="Action Dashboard" 
        subtitle="Daily rotation tasks for all studios"
      />
      
      <div className="p-8">
        <StatsBar />
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Today's Rotations</h2>
          <p className="text-sm text-muted-foreground">
            Complete the removal and addition of products for each studio
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {rotations.map((rotation) => (
            <StudioCard key={rotation.studio.id} rotation={rotation} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
