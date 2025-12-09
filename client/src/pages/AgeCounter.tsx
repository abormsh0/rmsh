import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function AgeCounter() {
  const targetDate = new Date("2024-08-13T00:00:00");
  const [timeElapsed, setTimeElapsed] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now.getTime() - targetDate.getTime();

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30.44);
      const years = Math.floor(months / 12);

      setTimeElapsed({
        years,
        months: months % 12,
        days: days % 30,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const TimeCard = ({ value, label }: { value: number; label: string }) => (
    <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="text-4xl font-bold text-primary mb-2">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-5xl font-bold mb-4">عداد الوقت</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            الوقت المنقضي منذ 13 أغسطس 2024
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          <TimeCard value={timeElapsed.years} label="سنة" />
          <TimeCard value={timeElapsed.months} label="شهر" />
          <TimeCard value={timeElapsed.days} label="يوم" />
          <TimeCard value={timeElapsed.hours} label="ساعة" />
          <TimeCard value={timeElapsed.minutes} label="دقيقة" />
          <TimeCard value={timeElapsed.seconds} label="ثانية" />
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              التاريخ المرجعي: <span className="text-primary font-bold">13 أغسطس 2024</span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
