import { CrisisControlCenter } from '@/components/crisis/CrisisControlCenter';
import { CrisisDataProvider } from '@/contexts/CrisisDataContext';

export default function CrisisControlPage() {
  return (
    <CrisisDataProvider useMock>
      <CrisisControlCenter />
    </CrisisDataProvider>
  );
}