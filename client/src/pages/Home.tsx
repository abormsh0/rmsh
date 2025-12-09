import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { MessageSquare, Upload, Lock, Youtube, Clock, Image as ImageIcon, LogOut } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("تم تسجيل الخروج بنجاح");
    },
  });

  const features = [
    {
      icon: MessageSquare,
      title: "دردشة ذكية",
      description: "تواصل مع مساعد ذكي يفهم النصوص والصور ويرد بذكاء",
      link: "/chat",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Upload,
      title: "معرض الملفات",
      description: "ارفع وأدر جميع ملفاتك بسهولة مع التخزين السحابي الآمن",
      link: "/gallery",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Lock,
      title: "معارض محمية",
      description: "معارض صور خاصة محمية بكلمة مرور للخصوصية الكاملة",
      link: "/protected-galleries",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Youtube,
      title: "قنوات يوتيوب",
      description: "شاهد الفيديوهات المميزة من قنوات يوتيوب المختارة",
      link: "/youtube",
      gradient: "from-red-600 to-red-400",
    },
    {
      icon: Clock,
      title: "عداد الوقت",
      description: "تابع الوقت المنقضي منذ 13 أغسطس 2024 بشكل تفاعلي",
      link: "/age-counter",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              مركز الوسائط المتعددة
            </h1>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  مرحباً، {user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>تسجيل الدخول</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            مركز الوسائط المتعددة
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            منصة متكاملة تجمع بين الدردشة الذكية وإدارة الملفات ومشاهدة المحتوى
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <a href={getLoginUrl()}>
                  ابدأ الآن
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="#features">استكشف الميزات</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">الميزات الرئيسية</h3>
          <p className="text-slate-600 dark:text-slate-400">
            استكشف جميع الإمكانيات المتاحة في المنصة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} href={user ? feature.link : "#"}>
              <Card className="group h-full p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
                {!user && (
                  <p className="text-xs text-primary mt-4 font-medium">
                    يتطلب تسجيل الدخول
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">جاهز للبدء؟</h3>
            <p className="text-xl mb-8 opacity-90">
              سجل الدخول الآن للوصول إلى جميع الميزات وابدأ باستخدام المنصة
            </p>
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <a href={getLoginUrl()}>
                تسجيل الدخول الآن
              </a>
            </Button>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600 dark:text-slate-400">
          <p>© 2024 مركز الوسائط المتعددة. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
