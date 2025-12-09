import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Gallery() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: files, isLoading: filesLoading } = trpc.files.getFiles.useQuery(undefined, {
    enabled: !!user,
  });

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      utils.files.getFiles.invalidate();
      toast.success("تم رفع الملف بنجاح");
    },
    onError: () => {
      toast.error("فشل رفع الملف");
    },
  });

  const deleteFile = trpc.files.deleteFile.useMutation({
    onSuccess: () => {
      utils.files.getFiles.invalidate();
      toast.success("تم حذف الملف");
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 16 ميجابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (base64) {
        uploadFile.mutate({
          filename: file.name,
          contentType: file.type,
          base64Data: base64,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (authLoading || filesLoading) {
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
          <h1 className="text-4xl font-bold mb-4">معرض الملفات</h1>
          <p className="text-slate-600 dark:text-slate-400">
            قم برفع وإدارة جميع ملفاتك المرفوعة
          </p>
        </div>

        <div className="mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFile.isPending}
            size="lg"
          >
            {uploadFile.isPending ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 ml-2" />
            )}
            رفع ملف جديد
          </Button>
        </div>

        {files && files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {file.mimeType?.startsWith("image/") ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate mb-2">{file.filename}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(file.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(file.url, file.filename)}
                    >
                      <Download className="w-4 h-4 ml-1" />
                      تنزيل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteFile.mutate({ fileId: file.id })}
                      disabled={deleteFile.isPending}
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
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-medium mb-2">لا توجد ملفات</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              ابدأ برفع ملفاتك الآن
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 ml-2" />
              رفع ملف
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
