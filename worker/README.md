# Benefit Extraction Worker

A standalone background worker for processing PDF benefit guides with Claude AI. No timeout limits - processes PDFs of any size.

## Why a Separate Worker?

Supabase Edge Functions have timeout limits (60-150 seconds) that can cause issues with large PDFs. This worker runs externally with no timeout limits, making it reliable for processing large documents.

## Deployment Options

### Option 1: Railway (Recommended)

1. **Create Railway Account**: https://railway.app
2. **Deploy from GitHub**:
   - Connect your GitHub repo
   - Select the `worker` directory
   - Railway auto-detects Node.js
3. **Set Environment Variables**:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   WORKER_SECRET=your-secret-here
   ```
4. **Get Worker URL**: Railway provides a public URL like `https://your-app.railway.app`

### Option 2: Render

1. **Create Render Account**: https://render.com
2. **Create Web Service**:
   - Connect your GitHub repo
   - Root Directory: `worker`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Set Environment Variables** (same as above)
4. **Get Worker URL**: Render provides a URL like `https://your-app.onrender.com`

### Option 3: Fly.io

1. **Install flyctl**: https://fly.io/docs/hands-on/install-flyctl/
2. **Deploy**:
   ```bash
   cd worker
   fly launch
   fly secrets set ANTHROPIC_API_KEY=sk-ant-...
   fly secrets set SUPABASE_URL=https://your-project.supabase.co
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
   fly secrets set WORKER_SECRET=your-secret-here
   fly deploy
   ```

## Configure Supabase Edge Function

After deploying the worker, add these secrets to your Supabase Edge Function:

```bash
supabase secrets set WORKER_URL=https://your-worker-url.railway.app
supabase secrets set WORKER_SECRET=your-secret-here
```

Then redeploy the Edge Function:

```bash
supabase functions deploy extract-benefits
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Upload Flow                              │
├─────────────────────────────────────────────────────────────┤
│  1. Admin uploads PDF via Admin Portal                       │
│  2. PDF stored in Supabase Storage                          │
│  3. Edge Function receives extraction request               │
│  4. Edge Function calls Worker: POST /extract               │
│  5. Worker returns immediately (202 Accepted)               │
│  6. Worker downloads PDF from Supabase Storage              │
│  7. Worker calls Claude API (no timeout limit)              │
│  8. Worker stores results in Supabase database              │
│  9. Admin sees results via real-time subscription           │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### `POST /extract`
Start PDF extraction.

**Request**:
```json
{
  "documentId": "uuid-of-document"
}
```

**Headers**:
```
Authorization: Bearer <WORKER_SECRET>
Content-Type: application/json
```

**Response** (immediate):
```json
{
  "success": true,
  "message": "Extraction started",
  "documentId": "uuid-of-document"
}
```

### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Local Development

```bash
cd worker
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

## Cost Estimates

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | $5 credit/month | ~$5-10/month |
| Render | 750 hours/month | ~$7/month |
| Fly.io | 3 shared VMs | ~$5/month |

All options are very affordable for this use case since the worker only runs when processing PDFs.
