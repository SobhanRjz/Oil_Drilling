# Drilling DQ Demo v2

Data Quality application for drilling data: Upload CSV → Profile → Clean (dedup/standardize/impute) → Anomaly Detection → Export.

## Features

- **Data Upload**: Upload CSV files for analysis
- **Data Profiling**: Comprehensive data quality metrics
- **Data Cleaning**: Deduplication, standardization, and imputation
- **Anomaly Detection**: IQR and Isolation Forest methods
- **General Overview**: Data quality scores and statistics
- **Export**: Download cleaned datasets

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# Development
cd infra/docker
.\dev.bat                 # Windows
./dev.sh                  # Linux/Mac

# Production-local testing (with Nginx)
cd infra/docker
.\prod-local.bat          # Windows

# Production deployment (backend only)
cd infra/docker
.\prod.bat                # Windows
```

📚 See [Docker Documentation](infra/docker/README.md) for complete guide.

### Option 2: Local Development (Python)

```bash
# Create virtual environment
python -m venv .venv

# Activate
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn backend.main:app --reload
```

Open http://localhost:8000

### Option 3: Build Standalone Executable

```bash
python -m PyInstaller drilling_dq.spec
```

## 📁 Project Structure

```
drilling_dq_demo_v2/
├── backend/              # FastAPI backend
│   ├── main.py          # Main application
│   ├── auth.py          # Authentication
│   ├── cleaning.py      # Data cleaning logic
│   ├── profiling.py     # Data profiling
│   └── services/        # Service layer
├── frontend/            # HTML/CSS/JS frontend
│   ├── *.html          # Page templates
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript modules
├── data/               # Data storage
├── infra/              # Infrastructure
│   └── docker/         # Docker configurations
└── requirements.txt    # Python dependencies
```

## 🐳 Docker Deployment

Three deployment modes available:

| Mode | Port | Nginx | Use Case |
|------|------|-------|----------|
| **Development** | 8000 | ❌ | Local development with hot-reload |
| **Prod-Local** | 8080 | ✅ Bundled | Test production setup locally |
| **Production** | 8000* | ⚙️ You provide | Server deployment |

\* Binds to 127.0.0.1 for security

See [Docker Quick Start](infra/docker/QUICK-START.md) and [Deployment Guide](infra/docker/DEPLOYMENT.md).

## 🔒 Security

- Authentication required for all pages
- Cookie-based session management
- Rate limiting (in production with Nginx)
- Security headers
- CORS configured
- Backend binds to localhost in production

Default credentials are configured in `backend/auth.py` - **change these in production!**

## 🛠️ Technology Stack

- **Backend**: FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Deployment**: Docker, Docker Compose, Nginx
- **Python**: 3.11+

## 📖 Documentation

- [Docker README](infra/docker/README.md) - Complete Docker documentation
- [Quick Start Guide](infra/docker/QUICK-START.md) - Quick reference
- [Deployment Guide](infra/docker/DEPLOYMENT.md) - Production deployment steps

## 🚦 Development Workflow

1. **Develop**: Use Docker dev mode or local Python environment
2. **Test**: Test with `prod-local` to verify Nginx integration
3. **Deploy**: Deploy with `prod` and configure server Nginx

## 📊 API Endpoints

- `POST /api/login` - User authentication
- `POST /api/upload` - Upload CSV file
- `GET /api/profile` - Get data profile
- `GET /api/general` - General statistics
- `GET /api/cleansing/preview` - Preview cleaning suggestions
- `POST /api/cleansing/apply` - Apply cleaning operations
- `GET /api/anomalies/summary` - Anomaly detection summary
- `GET /api/anomalies/rows` - Get flagged anomaly rows
- `GET /api/export/csv` - Export cleaned data

## 🧪 Testing

```bash
# Access the application
curl http://localhost:8000/login

# Health check (with Nginx)
curl http://localhost:8080/health
```

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, check the logs:

```bash
# Docker
docker-compose -f infra/docker/docker-compose.prod.yml logs -f

# Local
# Check terminal output
```