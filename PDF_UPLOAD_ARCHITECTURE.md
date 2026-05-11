# PDF Upload Architecture - Production Deployment

## Overview
This document describes the production-ready, Vercel-compatible PDF processing flow for StudyFlow.

## Architecture: Client-Side Only Processing

### Why Client-Side?
- ✅ Vercel serverless has **no persistent filesystem**
- ✅ **Instant processing** - no network latency for parsing
- ✅ **Reduced backend load** - server doesn't process PDFs
- ✅ **Lower costs** - no serverless compute for parsing
- ✅ **Better UX** - real-time feedback in browser
- ❌ ~~No file upload to backend~~ → Text only
- ❌ ~~No /uploads directory~~ → In-memory only

---

## Data Flow

```
User's Computer
    ↓
[File Input Dialog] ← User selects PDF from Desktop/Downloads/Documents
    ↓
Browser (Client-Side)
    ├─ Validate file type & size
    ├─ Read ArrayBuffer using File API
    ├─ Import pdfjs-dist dynamically
    ├─ Configure worker from /public/pdf.worker.min.mjs
    ├─ Parse PDF: pdfjs.getDocument({ data: ArrayBuffer })
    ├─ Extract text from all pages
    ├─ Store in-memory: useStudyStore (Zustand)
    └─ Success notification to user
    ↓
Extracted Text (in-memory only)
    ├─ NOT saved to disk
    ├─ NOT uploaded as file
    └─ Available for backend APIs:
       ├─ /api/flashcards (generate from text)
       ├─ /api/quiz (create quiz from text)
       ├─ /api/chat (AI tutor uses text)
       └─ /api/study-data (store metadata)
```

---

## File Structure

### Frontend Components
```
src/app/dashboard/page.tsx
├─ handleUpload() function
│  ├─ Validates file type & size
│  ├─ Reads file as ArrayBuffer
│  ├─ Imports pdfjs-dist/legacy/build/pdf
│  ├─ Sets worker: /pdf.worker.min.mjs
│  ├─ Extracts text from all pages
│  ├─ Calls setActiveDocument() (Zustand store)
│  └─ Shows success/error alerts
└─ isHydrated state (prevents hydration mismatch)
```

### Storage Layer
```
src/store/useStudyStore.ts
├─ activeDocumentName: string | null
├─ activeDocumentText: string | null
└─ setActiveDocument(name, text) → updates store
```

### Worker Configuration
```
public/pdf.worker.min.mjs (1.3 MB)
├─ Deployed to Vercel's static folder
├─ Served via /public path
└─ Loaded by pdfjs-dist for multi-threaded parsing (fallback: single-threaded)
```

### API Routes (Updated)
```
src/app/api/upload/route.ts
├─ Status: 501 Not Implemented
├─ Reason: All processing happens client-side
└─ Documentation: See PDF_UPLOAD_ARCHITECTURE.md

src/app/api/flashcards/route.ts
├─ Input: { documentText: string, ... }
└─ Processes extracted text (NO file)

src/app/api/quiz/route.ts
├─ Input: { documentText: string, ... }
└─ Processes extracted text (NO file)
```

---

## Configuration

### pdfjs-dist Setup
```typescript
// Dynamic import to optimize bundle size
const pdfjs = await import("pdfjs-dist/legacy/build/pdf");

// Worker configuration (from /public folder)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Document loading with fallback
const pdf = await pdfjs.getDocument({
  data: arrayBuffer,
  disableWorker: true, // Single-threaded fallback for Vercel
}).promise;
```

### next.config.ts
```typescript
{
  output: "standalone",                    // Vercel serverless-safe
  images: { unoptimized: true },          // No Image Optimization
  productionBrowserSourceMaps: false,     // Smaller bundles
  swcMinify: true,                        // Optimized minification
}
```

---

## Constraints & Limits

| Item | Limit | Reason |
|------|-------|--------|
| Max file size | 50 MB | Browser memory limit |
| Max pages | 1000 | Safety limit (prevent runaway parsing) |
| Worker threads | 1 (fallback) | Vercel serverless compatible |
| Storage | In-memory only | No persistence between sessions |
| Supported formats | PDF text only | No images/scanned docs |

---

## Error Handling

### User Scenarios

| Scenario | Error | Resolution |
|----------|-------|-----------|
| Non-PDF file | "Please select a valid PDF file" | Validate MIME type |
| File > 50MB | "File size exceeds 50MB" | Compress or split PDF |
| Corrupted PDF | "File appears to be corrupted" | Re-export PDF from source |
| Scanned/Image PDF | "No text found in PDF" | Use OCR scanning first |
| Invalid PDF structure | "Invalid PDF: No pages found" | Verify PDF integrity |

### Developer Debugging

```typescript
// All errors logged to browser console
console.error("PDF processing error:", err);

// Check worker load
console.log(pdfjs.GlobalWorkerOptions.workerSrc);

// Verify extraction
console.log("Extracted characters:", fullText.length);
console.log("Pages processed:", pageCount);
```

---

## Deployment Checklist for Vercel

- [x] No filesystem operations (no `fs`, `writeFile`, `readFile`, temp folders)
- [x] No `/uploads` directory
- [x] Worker file in `/public` folder
- [x] Dynamic import of pdfjs-dist
- [x] Fallback to single-threaded parsing (`disableWorker: true`)
- [x] File size validation (50MB max)
- [x] Error handling with user-friendly messages
- [x] next.config.ts set to `output: "standalone"`
- [x] No server-side PDF parsing
- [x] Backend APIs accept text-only input

---

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Open http://localhost:3000/dashboard
# Click "Upload New Material"
# Select a PDF from your computer
# Verify success notification
```

### Production Testing (Vercel)
```bash
# After deployment
1. Navigate to https://studyflow.vercel.app/dashboard
2. Upload test PDF
3. Verify in DevTools Console:
   - No "ENOENT" errors
   - No "413 Request Entity Too Large"
   - No worker fetch failures
   - Extracted text appears in store
```

---

## Troubleshooting

### Issue: "Failed to fetch pdf.worker.min.mjs"
- **Cause**: Worker not deployed to `/public`
- **Fix**: Run `npm run build` and verify `public/pdf.worker.min.mjs` exists
- **Verify**: Check Vercel deployment logs

### Issue: "Hydration failed"
- **Cause**: Server renders different subjects than client localStorage
- **Fix**: `isHydrated` flag prevents render until client hydrates
- **Verify**: Check browser console for hydration warnings

### Issue: "No text extracted from PDF"
- **Cause**: PDF is scanned image (not searchable text)
- **Fix**: Use OCR tool to convert scanned PDF to searchable first
- **Verify**: Open PDF in Adobe Reader and search for text

### Issue: File size limit exceeded during development
- **Cause**: Browser memory limit exceeded during parsing
- **Fix**: Increase MAX_SIZE limit or use chunked parsing
- **Verify**: Check browser DevTools Memory tab

---

## Future Improvements

1. **Chunked Parsing**: Split large PDFs into pages for progressive extraction
2. **Web Workers**: Use actual worker threads for multi-threaded parsing
3. **OCR Support**: Integrate Tesseract.js for scanned PDFs
4. **Cloud Storage**: Optional: S3/Cloudinary integration for document history
5. **Streaming**: Stream extracted text to backend as it's parsed
6. **Compression**: Compress extracted text before storing

---

## References

- [pdfjs-dist Documentation](https://mozilla.github.io/pdf.js/getting_started/)
- [File API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [ArrayBuffer (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

**Last Updated**: May 11, 2026
**Status**: Production Ready ✅
