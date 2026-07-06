/**
 * Resolve relative database URLs (like /uploads/...) to absolute backend URLs in production.
 * If the URL is already absolute (http, https, data:), it returns it unchanged.
 */
export function resolveImageUrl(url) {
  if (!url) return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600";
  
  if (
    url.startsWith("http://") || 
    url.startsWith("https://") || 
    url.startsWith("data:")
  ) {
    return url;
  }
  
  // Prepend backend base URL
  const base = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? "https://vrital-api-1yxc.onrender.com" : "http://127.0.0.1:8000");
    
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}
