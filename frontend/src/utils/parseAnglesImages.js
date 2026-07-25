/**
 * Safely parses a comma-separated list of image URLs or base64 data URLs.
 * Handles the fact that a base64 URL itself contains a comma (e.g. data:image/png;base64,xxxx).
 */
export function parseAnglesImages(product) {
  if (!product) return [];
  const str = product.angles_images_url;
  
  if (!str) {
    return [
      product.main_image_url ||
      product.image_url ||
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
    ];
  }

  // Handle base64 data URLs separated by commas
  if (str.includes(",data:") || str.includes(", data:")) {
    const delimiter = str.includes(", data:") ? ", data:" : ",data:";
    return str.split(delimiter).map((item, idx) => {
      const trimmed = item.trim();
      return idx === 0 ? trimmed : "data:" + trimmed;
    }).filter(Boolean);
  }

  // Handle standard HTTP URLs separated by commas
  return str.split(",").map((url) => url.trim()).filter(Boolean);
}
