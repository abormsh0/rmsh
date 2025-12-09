import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Loader2, Youtube } from "lucide-react";

export default function YouTubePage() {
  const { data: channels, isLoading } = trpc.youtube.getChannels.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <Youtube className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-4xl font-bold mb-4">قنوات يوتيوب</h1>
          <p className="text-slate-600 dark:text-slate-400">
            شاهد الفيديوهات المميزة من قنوات يوتيوب المختارة
          </p>
        </div>

        {channels && channels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card
                key={channel.id}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => window.open(channel.channelUrl, "_blank")}
              >
                <div className="aspect-video bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  {channel.thumbnailUrl ? (
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.channelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Youtube className="w-16 h-16 text-white" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{channel.channelName}</h3>
                  {channel.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                      {channel.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Youtube className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-medium mb-2">لا توجد قنوات</h3>
            <p className="text-slate-600 dark:text-slate-400">
              لم يتم إضافة أي قنوات يوتيوب بعد
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
