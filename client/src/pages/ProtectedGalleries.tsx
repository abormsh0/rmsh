import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Lock, Trash2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ProtectedGalleries() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [newGallery, setNewGallery] = useState({
    title: "",
    description: "",
    password: "",
  });
  const [passwordInput, setPasswordInput] = useState("");

  const utils = trpc.useUtils();

  const { data: galleries, isLoading: galleriesLoading } = trpc.galleries.getGalleries.useQuery(undefined, {
    enabled: !!user,
  });

  const createGallery = trpc.galleries.create.useMutation({
    onSuccess: () => {
      utils.galleries.getGalleries.invalidate();
      setIsCreateDialogOpen(false);
      setNewGallery({ title: "", description: "", password: "" });
      toast.success("تم إنشاء المعرض بنجاح");
    },
  });

  const verifyPassword = trpc.galleries.verifyPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        navigate(`/gallery/${selectedGalleryId}`);
      } else {
        toast.error("كلمة المرور غير صحيحة");
      }
    },
  });

  const deleteGallery = trpc.galleries.delete.useMutation({
    onSuccess: () => {
      utils.galleries.getGalleries.invalidate();
      toast.success("تم حذف المعرض");
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleCreateGallery = () => {
    if (!newGallery.title || !newGallery.password) {
      toast.error("الرجاء إدخال العنوان وكلمة المرور");
      return;
    }
    createGallery.mutate(newGallery);
  };

  const handleVerifyPassword = () => {
    if (!passwordInput) {
      toast.error("الرجاء إدخال كلمة المرور");
      return;
    }
    verifyPassword.mutate({
      galleryId: selectedGalleryId!,
      password: passwordInput,
    });
  };

  if (authLoading || galleriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">المعارض المحمية</h1>
          <p className="text-slate-600 dark:text-slate-400">
            معارض صور خاصة محمية بكلمة مرور للخصوصية الكاملة
          </p>
        </div>

        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 ml-2" />
                إنشاء معرض جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء معرض محمي</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">العنوان</Label>
                  <Input
                    id="title"
                    value={newGallery.title}
                    onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                    placeholder="عنوان المعرض"
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Input
                    id="description"
                    value={newGallery.description}
                    onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })}
                    placeholder="وصف المعرض"
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newGallery.password}
                    onChange={(e) => setNewGallery({ ...newGallery, password: e.target.value })}
                    placeholder="كلمة مرور قوية"
                  />
                </div>
                <Button
                  onClick={handleCreateGallery}
                  disabled={createGallery.isPending}
                  className="w-full"
                >
                  {createGallery.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إنشاء المعرض"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {galleries && galleries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <Card key={gallery.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {gallery.coverImageUrl ? (
                    <img
                      src={gallery.coverImageUrl}
                      alt={gallery.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Lock className="w-16 h-16 text-primary" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{gallery.title}</h3>
                  {gallery.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {gallery.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mb-4">
                    {new Date(gallery.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedGalleryId(gallery.id);
                        setIsPasswordDialogOpen(true);
                        setPasswordInput("");
                      }}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGallery.mutate({ galleryId: gallery.id })}
                      disabled={deleteGallery.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-medium mb-2">لا توجد معارض</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              أنشئ معرضاً محمياً لتخزين صورك الخاصة
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء معرض
            </Button>
          </Card>
        )}

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>أدخل كلمة المرور</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password-input">كلمة المرور</Label>
                <Input
                  id="password-input"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  placeholder="أدخل كلمة المرور"
                />
              </div>
              <Button
                onClick={handleVerifyPassword}
                disabled={verifyPassword.isPending}
                className="w-full"
              >
                {verifyPassword.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "تحقق"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
