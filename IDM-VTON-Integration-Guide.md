# 🧥 IDM-VTON Virtual Try-On System – Integration Guide

## 📌 Overview

This document explains how to integrate the IDM-VTON virtual try-on system with a modern web application (React frontend + backend API).

The system uses:

- **React** (Frontend UI)
- **Python Backend** (API Layer)
- **IDM-VTON Model** via Hugging Face
- **Local server bridge** (localhost:8001)

---

## 🏗️ System Architecture

```
React Frontend
      ↓
Backend API (Node.js or Python)
      ↓
IDM-VTON Server (localhost:8001)
      ↓
Hugging Face IDM-VTON Model
      ↓
Generated Try-On Image
```

---

## 🚀 Backend Server Setup

### 1. Start IDM-VTON Server

Run the local server:

```bash
python idm_vton_server.py
```

Server should be available at:

```
http://localhost:8001
```

---

### 2. Verify Server Status

Check if the server is running:

```
http://localhost:8001/health
```

Expected response:

```json
{ "status": "ok" }
```

---

## 🎯 API Endpoint

### Try-On Request

**`POST /tryon`**

#### Request Format

```
FormData:
- person: image file (user photo)
- garment: image file (clothing item)
```

---

## ⚛️ React Frontend Integration

### 1. Upload & Send Images

```javascript
const formData = new FormData();
formData.append("person", personImage);
formData.append("garment", garmentImage);

const response = await fetch("http://localhost:8001/tryon", {
  method: "POST",
  body: formData,
});

const data = await response.json();
```

---

### 2. Display Result Image

```jsx
<img
  src={data.result_image}
  alt="Virtual Try-On Result"
  style={{ width: "300px", borderRadius: "12px" }}
/>
```

---

## 🔁 Optional Backend Layer (Node.js)

If you want production-level architecture:

```
React → Node.js API → IDM-VTON Server → Hugging Face
```

#### Node.js Example

```javascript
import axios from "axios";
import FormData from "form-data";

export const tryOn = async (personFile, garmentFile) => {
  const formData = new FormData();
  formData.append("person", personFile);
  formData.append("garment", garmentFile);

  const response = await axios.post(
    "http://localhost:8001/tryon",
    formData,
    {
      headers: formData.getHeaders(),
    }
  );

  return response.data;
};
```

---

## ⚙️ Performance Modes

| Mode                    | Time     | Description                             |
|-------------------------|----------|-----------------------------------------|
| Hugging Face IDM-VTON   | 20–60s   | High quality AI processing              |
| Fallback Pipeline v3    | < 2s     | Basic image composition (low quality)   |
| Future FASHN AI         | 5–15s    | Optimized cloud API                     |

---

## 🎨 Best Practices (Very Important)

### 👤 Person Image

- Full body visible
- Front-facing pose
- Good lighting
- No heavy occlusion (hands covering body)

### 👕 Garment Image

- Flat-lay or product image
- Single clothing item
- Clean background
- High resolution

---

## ⚠️ Common Issues

### ⏳ Slow response (20–60s)
✔ **Normal** — This is expected Hugging Face processing time.

### ⚡ Very fast response (< 2s)
❌ **Problem** — You are using the fallback pipeline (low quality).

### ❌ No result / error
- Server not running
- Wrong endpoint
- Hugging Face timeout

---

## 🧠 System Behavior Logic

```
IF FASHN_API_KEY exists       → use Fashn AI
ELIF REPLICATE_TOKEN exists   → use Replicate IDM-VTON
ELIF AI_SERVICE_URL active    → use remote IDM-VTON server
ELSE                          → fallback pipeline (low quality)
```

---

## 🏁 Final Notes

- This system depends heavily on **image quality**
- IDM-VTON provides the best balance of realism and flexibility
- Frontend UX is as important as model accuracy
- Always ensure server stability before production use

---

> 🚀 End of Documentation
