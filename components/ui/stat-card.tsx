interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient?: 'blue' | 'orange' | 'green' | 'purple';
}

export function StatCard({ title, value, icon, gradient = 'blue' }: StatCardProps) {
  const gradients = {
    blue: 'from-[#1E3A5F] to-[#2D4F7C]',
    orange: 'from-[#FF6B35] to-[#FF8C61]',
    green: 'from-green-600 to-green-500',
    purple: 'from-purple-600 to-purple-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#1E3A5F]/10 overflow-hidden transform hover:scale-105">
      <div className={`bg-linear-to-br ${gradients[gradient]} p-4`}>
        <div className="flex items-center justify-between">
          <div className="text-white/80 text-sm font-semibold">{title}</div>
          <div className="text-white">{icon}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">{value}</div>
      </div>
    </div>
  );
}




