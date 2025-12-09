import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, Trash2, Upload, Mic, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const { data: conversations, isLoading: conversationsLoading } = trpc.chat.getConversations.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      utils.chat.getConversations.invalidate();
      setSelectedConversationId(data.conversationId);
      toast.success("تم إنشاء محادثة جديدة");
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      setMessageInput("");
      setUploadedImageUrl(null);
    },
  });

  const deleteConversation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      utils.chat.getConversations.invalidate();
      setSelectedConversationId(null);
      toast.success("تم حذف المحادثة");
    },
  });

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: (data) => {
      setUploadedImageUrl(data.url);
      toast.success("تم رفع الصورة بنجاح");
    },
  });

  const transcribeAudio = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      setMessageInput(data.text);
      toast.success("تم تحويل الصوت إلى نص");
    },
  });

  const generateImage = trpc.imageGen.generate.useMutation({
    onSuccess: (data) => {
      setUploadedImageUrl(data.url || null);
      toast.success("تم توليد الصورة بنجاح");
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !uploadedImageUrl) return;
    if (!selectedConversationId) {
      const result = await createConversation.mutateAsync({});
      setSelectedConversationId(result.conversationId);
    }

    sendMessage.mutate({
      conversationId: selectedConversationId!,
      content: messageInput || "صورة",
      imageUrl: uploadedImageUrl ?? undefined,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result?.toString().split(",")[1];
          if (base64) {
            const uploadResult = await uploadFile.mutateAsync({
              filename: `audio-${Date.now()}.webm`,
              contentType: "audio/webm",
              base64Data: base64,
            });
            transcribeAudio.mutate({ audioUrl: uploadResult.url });
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("جاري التسجيل...");
    } catch (error) {
      toast.error("فشل الوصول إلى الميكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGenerateImage = () => {
    if (!messageInput.trim()) {
      toast.error("الرجاء كتابة وصف للصورة");
      return;
    }
    generateImage.mutate({ prompt: messageInput });
  };

  if (authLoading || conversationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Button
            onClick={() => createConversation.mutate({})}
            className="w-full"
            disabled={createConversation.isPending}
          >
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations?.map((conv) => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  selectedConversationId === conv.id ? "bg-slate-100 dark:bg-slate-800 border-primary" : ""
                }`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate({ conversationId: conv.id });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(conv.updatedAt).toLocaleDateString("ar-SA")}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <Card
                        className={`max-w-2xl p-4 ${
                          msg.role === "user"
                            ? "bg-white dark:bg-slate-800"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded"
                            className="rounded-lg mb-2 max-w-md"
                          />
                        )}
                        <Streamdown>{msg.content}</Streamdown>
                        {msg.transcription && (
                          <p className="text-xs mt-2 opacity-70">نص الصوت: {msg.transcription}</p>
                        )}
                      </Card>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="max-w-4xl mx-auto">
                {uploadedImageUrl && (
                  <div className="mb-2 relative inline-block">
                    <img src={uploadedImageUrl} alt="Preview" className="h-20 rounded" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-0 left-0"
                      onClick={() => setUploadedImageUrl(null)}
                    >
                      ×
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFile.isPending}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribeAudio.isPending}
                  >
                    <Mic className={`w-4 h-4 ${isRecording ? "text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateImage}
                    disabled={generateImage.isPending}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="اكتب رسالتك..."
                    className="flex-1"
                    disabled={sendMessage.isPending}
                  />
                  <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">مرحباً بك في الدردشة الذكية</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                ابدأ محادثة جديدة أو اختر محادثة من القائمة
              </p>
              <Button onClick={() => createConversation.mutate({})}>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء محادثة جديدة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
