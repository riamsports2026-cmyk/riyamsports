import { Loader } from '@/components/ui/loader';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <Loader size="lg" label="Loading..." />
    </div>
  );
}


