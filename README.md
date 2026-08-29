# BuyBIBZ E-Commerce Platform

A full-stack e-commerce platform built with FastAPI (backend) and vanilla JavaScript (frontend), powered by Supabase.

## Features

- 🛍️ Product browsing and search
- 🛒 Shopping cart functionality
- 👤 User authentication and profiles
- 📦 Order management
- ⭐ Product reviews
- 👨‍💼 Admin dashboard
- 🌐 Multi-language support (i18n)

## Tech Stack

**Backend:**
- FastAPI (Python)
- Supabase (PostgreSQL + Auth)
- Python-Jose (JWT)

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design

## Local Development

### Prerequisites
- Python 3.9+
- Supabase account

### Setup

1. Clone the repository:
```bash
git clone https://github.com/phoungchanphattraseven-hub/BuyBIBZ.git
cd BuyBIBZ
```

2. Create `.env` file from the example:
```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

4. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

5. Run the backend:
```bash
uvicorn main:app --reload
```

6. Open frontend:
- Open `frontend/index.html` in your browser
- Or use a local server: `python -m http.server 8000`

## Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phoungchanphattraseven-hub/BuyBIBZ)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `ADMIN_EMAIL`
     - `ADMIN_PASSWORD`

5. Redeploy after setting environment variables:
```bash
vercel --prod
```

### Important Notes for Vercel Deployment

- The API will be available at: `https://your-domain.vercel.app/api/`
- Update `frontend/js/api.js` to use the Vercel API URL in production
- Update CORS settings in `backend/main.py` to allow your Vercel domain

## Project Structure

```
BuyBIBZ/
├── backend/
│   ├── core/           # Auth & config
│   ├── models/         # Pydantic schemas
│   ├── routers/        # API routes
│   └── main.py         # FastAPI app
├── frontend/
│   ├── css/            # Styles
│   ├── js/             # JavaScript modules
│   └── *.html          # HTML pages
├── api/                # Vercel serverless functions
├── logo/               # Brand assets
├── vercel.json         # Vercel configuration
└── .env.example        # Environment template
```

## API Documentation

Once deployed, access the API docs at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Database Schema

Run the `supabase_schema.sql` file in your Supabase SQL editor to set up the database.

## License

MIT License

## Contributors

- [@phoungchanphattraseven-hub](https://github.com/phoungchanphattraseven-hub)
