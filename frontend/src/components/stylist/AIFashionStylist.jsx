/**
 * AIFashionStylist — Luxury Conversational Fashion Concierge
 * ============================================================
 * Interactive AI Wardrobe Stylist providing bespoke outfit advice,
 * curated pieces from the catalog, and direct 1-click Virtual Try-On.
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, X, Send, ShoppingBag, ArrowRight, 
  Loader2, RefreshCw, Compass, Check, Bot, User 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguageStore } from "../../store/useLanguageStore";
import { useCartStore } from "../../store/useCartStore";
import { formatPrice } from "../../utils/formatPrice";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import api from "../../api/client";

const SUGGESTED_PROMPTS_EN = [
  "✨ Outfit for evening gala / formal dinner",
  "🕶️ Quiet Luxury / Minimalist daily look",
  "🏖️ Summer Mediterranean resort style",
  "💼 Modern tailored power dressing"
];

const SUGGESTED_PROMPTS_AR = [
  "✨ إطلالة لحفل سهرة ومناسبة راقية",
  "🕶️ ستايل مينيمال كاجوال فخم",
  "🏖️ أزياء عطلة صيفية مريحة",
  "💼 بدلة وتنسيق عمل عصري أنيق"
];

export default function AIFashionStylist() {
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: language === "ar"
        ? "مرحباً بك في أتيلييه مرايا. أنا مستشارك الشخصي للأناقة بالذكاء الاصطناعي. كيف يمكنني تنسيق إطلالتك اليوم؟"
        : "Welcome to the Maraya Digital Atelier. I am your AI Fashion Stylist. What occasion or aesthetic shall we style for you today?",
      recommendations: []
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (userText) => {
    const textToSend = userText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", content: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);

    try {
      const res = await api.post("/stylist/chat", {
        message: textToSend.trim(),
        preferred_gender: "unisex",
      });

      const assistantMsg = {
        role: "assistant",
        content: res.data.reply,
        lookTitle: res.data.look_title,
        styleArchetype: res.data.style_archetype,
        recommendations: res.data.recommendations || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: language === "ar"
            ? "عذراً، حدث خطأ مؤقت في الاتصال. يمكنك إعادة المحاولة أو تجربة أحد الاقتراحات السريعة."
            : "Apologies, a temporary connection hiccup occurred. Please try again or tap a suggested prompt.",
          recommendations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTryOn = (item) => {
    setIsOpen(false);
    const bSlug = brand_slug || "zara";
    navigate(`/brands/${bSlug}/tryon`, { state: item });
  };

  const prompts = language === "ar" ? SUGGESTED_PROMPTS_AR : SUGGESTED_PROMPTS_EN;

  return (
    <>
      {/* Floating Stylist Capsule Trigger */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-ink via-neutral-900 to-black text-white px-4 py-3 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-neutral-700/60 hover:border-amber-400/50 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-black flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles size={13} className="animate-spin-slow" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-100">
            {language === "ar" ? "خبير الأناقة AI" : "AI Stylist"}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      </div>

      {/* Slide-in Chatbot Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[#faf9f7] h-full shadow-2xl flex flex-col z-10 text-primary"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-rule flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink text-amber-300 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-medium">
                      {language === "ar" ? "مستشار الأناقة الرقمي" : "Maraya Digital Stylist"}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {language === "ar" ? "متصل للخدمة" : "Active Concierge"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-secondary hover:text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, index) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={index}
                      className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant && (
                        <div className="w-7 h-7 rounded-full bg-ink text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={13} />
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-3 ${isAssistant ? "items-start" : "items-end"}`}>
                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            isAssistant
                              ? "bg-white border border-rule text-primary shadow-sm rounded-tl-none"
                              : "bg-ink text-white rounded-tr-none"
                          }`}
                        >
                          {msg.lookTitle && (
                            <div className="mb-2 pb-2 border-b border-rule/60 flex items-center justify-between">
                              <span className="font-bold text-[10px] uppercase tracking-widest text-amber-600">
                                ✦ {msg.lookTitle}
                              </span>
                              {msg.styleArchetype && (
                                <span className="text-[9px] text-secondary font-mono">
                                  {msg.styleArchetype}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>

                        {/* Product Cards Grid if recommendations exist */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">
                              {language === "ar" ? "القطع المقترحة لإطلالتك:" : "Curated Wardrobe Pieces:"}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {msg.recommendations.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-white border border-rule p-2.5 rounded-lg flex flex-col justify-between space-y-2 shadow-sm"
                                >
                                  <div className="flex gap-2 items-center">
                                    <img
                                      src={resolveImageUrl(item.main_image_url)}
                                      alt={item.name}
                                      className="w-12 h-16 object-cover rounded bg-neutral-50 flex-shrink-0"
                                      onError={(e) => {
                                        e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200";
                                      }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                                        {item.brand_name || "Atelier"}
                                      </p>
                                      <h5 className="text-[11px] font-medium truncate text-primary">
                                        {item.name}
                                      </h5>
                                      <p className="text-[11px] font-bold text-primary">
                                        {formatPrice(item.price)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <button
                                      onClick={() => handleTryOn(item)}
                                      className="btn-black py-1.5 text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 rounded"
                                    >
                                      <Sparkles size={10} />
                                      <span>{language === "ar" ? "تجربة AI" : "Try-On"}</span>
                                    </button>
                                    <button
                                      onClick={() => addToCart(item, null, true)}
                                      className="btn-outline py-1.5 text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 rounded hover:bg-ink hover:text-white"
                                    >
                                      <ShoppingBag size={10} />
                                      <span>{language === "ar" ? "شراء" : "Bag"}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2.5 items-center text-secondary text-xs p-3 bg-white border border-rule rounded-xl max-w-xs shadow-sm">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>{language === "ar" ? "جاري تنسيق الإطلالة المختارة..." : "Curating your bespoke look..."}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Prompts Carousel */}
              <div className="px-6 py-2 bg-white/60 border-t border-rule overflow-x-auto flex gap-2 scrollbar-none">
                {prompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-rule hover:border-ink text-[10px] font-medium text-secondary hover:text-primary rounded-full transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-4 bg-white border-t border-rule">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={
                      language === "ar"
                        ? "اسأل الخبير (مثال: اقترح بدلة فاخرة لمناسبة مسائية)..."
                        : "Ask your stylist (e.g. Minimalist silk dress with heels)..."
                    }
                    className="flex-1 border border-rule px-4 py-2.5 text-xs rounded-full focus:outline-none focus:border-ink bg-[#faf9f7]"
                  />
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || loading}
                    className="btn-black w-10 h-10 rounded-full flex items-center justify-center p-0 flex-shrink-0 disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
