# VHM Construction Renovation - Railway Deployment

## Project Structure

```
vhmconsnew2026/
├── backend/              # FastAPI Python Backend
│   ├── server.py        # Main API server
│   ├── requirements.txt  # Python dependencies
│   └── ...
├── frontend/            # React Frontend
│   ├── src/
│   ├── package.json
│   └── ...
├── Dockerfile.backend   # Backend container
├── Dockerfile.frontend  # Frontend container
└── railway.json        # Railway configuration
```

## Deployment on Railway

### Services

1. **vhm-backend**: FastAPI server (Port 8000)
   - Dockerfile: `Dockerfile.backend`
   - Environment: `MONGO_URL`, `DB_NAME`, `SECRET_KEY`, `CORS_ORIGINS`

2. **vhm-frontend**: React app (Port 3000)
   - Dockerfile: `Dockerfile.frontend`
   - Environment: `REACT_APP_API_URL`

3. **vhm-mongo**: MongoDB database (required)
   - Use Railway MongoDB template

### Environment Variables

See `.env.example` for all required variables.

Key variables:
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: vhm_renovation)
- `SECRET_KEY`: JWT secret for authentication
- `CORS_ORIGINS`: Frontend domain for CORS

### Custom Domain Setup (123Reg.com)

For domain `vhmconstructionrenovation.be`:

**Option 1: Subdomain (www.example.com)**
- Create CNAME record: `www` → Railway domain target

**Option 2: Root Domain (example.be)**
- DNS provider must support CNAME flattening (Cloudflare, DNSimple, etc.)
- Or move DNS to Cloudflare first

## API Documentation

- Health check: `GET /api/`
- Leads API: `POST /api/leads` (create), `GET /api/admin/leads` (list)
- Authentication: `POST /api/auth/login`
- Admin dashboard: Requires authentication token

## Development Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="vhm_renovation"
python -m uvicorn server:app --reload

# Frontend
cd frontend
yarn install
yarn start
```

## Build & Deploy

Dockerfiles are configured to:
1. Install dependencies
2. Build/compile code
3. Run health checks
4. Expose appropriate ports

Deploy on Railway via:
1. Connect GitHub repo
2. Create services pointing to Dockerfiles
3. Set environment variables
4. Connect MongoDB
5. Set up custom domain

---

Created for Railway deployment with best practices.
