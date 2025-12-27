# Docker Infrastructure for Drilling DQ Demo v2

This directory contains Docker configuration for the Drilling Data Quality application.

## Structure

```
infra/docker/
├── Dockerfile                      # Multi-stage Docker image
├── .dockerignore                   # Files to exclude from build
├── docker-compose.dev.yml          # Development environment
├── docker-compose.prod.yml         # Production environment
├── docker-compose.prod-local.yml   # Production-local testing
├── nginx/
│   ├── nginx.conf                  # Main Nginx configuration
│   ├── conf.d/
│   │   └── default.conf           # Server configuration
│   └── logs/                       # Nginx logs (local only)
├── scripts/
│   ├── dev.sh                      # Development startup script
│   ├── prod.sh                     # Production startup script
│   └── prod-local.sh              # Production-local startup script
└── README.md                       # This file
```

## Quick Start

### Development Mode

For development with hot-reload:

```bash
# Windows
cd infra\docker
.\dev.bat

# Linux/Mac
cd infra/docker
./dev.sh
```

Access the application at: http://localhost:8000

### Production-Local Mode

Test production setup locally with Nginx:

```bash
# Windows
# Windows
cd infra\docker
.\dev.bat

# Linux/Mac
cd infra/docker
./dev.sh

```

Access the application at: http://localhost:8080

### Production Mode

Production deployment (backend only, configure Nginx separately):

```bash
# Windows
cd infra\docker
.\prod.bat

# Linux/Mac
cd infra/docker
./prod.sh
```

Backend will be available at: http://localhost:8000

**Important**: Configure your own Nginx on the server to proxy to this backend. See `nginx/server-config-example.conf` for a sample configuration.

## Environments

### Development
- **Target**: Local development
- **Port**: 8000 (direct backend access)
- **Features**:
  - Hot-reload enabled
  - Source code mounted as volumes
  - Debug logging
  - No Nginx proxy
- **Use case**: Active development and debugging

### Production-Local
- **Target**: Local production testing
- **Port**: 8080 (Nginx proxy)
- **Features**:
  - Production-like environment
  - Nginx reverse proxy included
  - Bind mounts for easier testing
  - Production optimizations
  - Full stack testing with Nginx
- **Use case**: Testing production setup before deployment

### Production
- **Target**: Production server deployment
- **Port**: 8000 (backend only, exposed for external Nginx)
- **Features**:
  - Backend only (no Nginx container)
  - External Nginx configuration (you provide)
  - Docker volumes for data persistence
  - Multiple Uvicorn workers
  - Health checks
  - Production optimizations
- **Use case**: Production deployment where you configure Nginx yourself on the server
- **Note**: See `nginx/server-config-example.conf` for sample Nginx configuration

## Configuration

### Environment Variables

You can customize the deployment by setting environment variables:

**Development:**
```bash
export ENVIRONMENT=development
export LOG_LEVEL=debug
```

**Production:**
```bash
export ENVIRONMENT=production
export LOG_LEVEL=info
```

### Nginx Configuration

#### Production-Local
The production-local setup includes Nginx container with:
- Rate limiting (10 req/s for API, 2 req/s for uploads)
- Gzip compression
- Security headers
- Static file caching
- Health check endpoint at `/health`

To modify settings, edit:
- `nginx/nginx.conf` - Main configuration
- `nginx/conf.d/default.conf` - Server configuration

#### Production (Server)
Production deployment does NOT include Nginx. You need to configure Nginx on your server.

A sample configuration is provided in `nginx/server-config-example.conf`. To use it:

1. Copy to your server: `/etc/nginx/sites-available/drilling-dq`
2. Update `server_name` with your domain
3. Configure SSL certificates if needed
4. Create symlink: `sudo ln -s /etc/nginx/sites-available/drilling-dq /etc/nginx/sites-enabled/`
5. Test: `sudo nginx -t`
6. Reload: `sudo systemctl reload nginx`

### Project Names

Each environment uses a specific project name to avoid conflicts:

- **Development**: `cleaningdata-dev`
- **Production-Local**: `cleaningdata-prod-local`
- **Production**: `cleaningdata-prod`

### Port Configuration

Ports can be changed in the respective docker-compose files:

- **Development**: `docker-compose.dev.yml` (default: 8000)
- **Production-Local**: `docker-compose.prod-local.yml` (default: 8080 via Nginx)
- **Production**: `docker-compose.prod.yml` (default: 8000 backend, configure your Nginx separately)

## Commands

### Build Images

```bash
# Development
docker-compose -f docker-compose.dev.yml -p cleaningdata-dev up --build -d

# Production
docker-compose -f docker-compose.prod.yml -f docker-compose.prod-local.yml -p cleaningdata-prod-local up -d --build
```

### Start Services

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production-Local
docker-compose -f docker-compose.prod-local.yml up

# Production (detached)
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Stop, remove containers, and volumes
docker-compose -f docker-compose.prod.yml down -v
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Execute Commands in Container

```bash
# Access backend container shell
docker exec -it drilling_dq_backend /bin/bash

# Run a Python command
docker exec -it drilling_dq_backend python -c "import pandas; print(pandas.__version__)"
```

## Data Persistence

### Development
- Source code mounted as volumes (hot-reload)
- Data directory: `../../data` (bind mount)

### Production-Local
- Data directory: `../../data` (bind mount)

### Production
- Data volume: `drilling_dq_data` (Docker volume)

To backup production data:
```bash
# Linux/Mac
docker run --rm -v drilling_dq_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data

# Windows
docker run --rm -v drilling_dq_data:/data -v %cd%:/backup alpine tar czf /backup/data-backup.tar.gz /data
```

## Health Checks

The production setup includes health checks:

**Backend:**
- Endpoint: `http://localhost:8000/login`
- Interval: 30s
- Timeout: 10s
- Retries: 3

**Nginx:**
- Endpoint: `http://localhost/login`
- Interval: 30s
- Timeout: 10s
- Retries: 3

Check health status:
```bash
docker ps
docker inspect --format='{{.State.Health.Status}}' drilling_dq_backend
```

## Networking

All services communicate through the `drilling_dq_network` bridge network:
- Backend service accessible to Nginx at `backend:8000`
- Isolated from host network (except exposed ports)

## Security Considerations

### Production Checklist
- [ ] Change default ports if needed
- [ ] Configure HTTPS/SSL certificates
- [ ] Update rate limiting thresholds
- [ ] Review and harden security headers
- [ ] Set up proper logging and monitoring
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Backup strategy for data volumes

### HTTPS Setup (Production)

To enable HTTPS, update `docker-compose.prod.yml`:

1. Add SSL certificate volumes:
```yaml
volumes:
  - ./nginx/ssl:/etc/nginx/ssl:ro
```

2. Update nginx configuration to listen on port 443
3. Redirect HTTP to HTTPS

## Troubleshooting

### Container won't start
```bash
# Check logs (specify project name if needed)
docker-compose -f docker-compose.dev.yml -p cleaningdata-dev logs

# Check container status
docker ps -a

# Rebuild without cache
docker-compose -f docker-compose.dev.yml -p cleaningdata-dev build --no-cache
```

### Port already in use
```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000

# Change port in docker-compose file
```

### Permission issues
```bash
# Fix data directory permissions
chmod -R 755 ../../data
```

### Database/Data issues
```bash
# Reset volumes
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up
```

## Performance Tuning

### Uvicorn Workers
Adjust workers in `Dockerfile` CMD:
```dockerfile
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Recommended: `(2 x CPU cores) + 1`

### Nginx Worker Connections
Adjust in `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}
```

### Rate Limiting
Adjust in `nginx/conf.d/default.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

## Maintenance

### Update Dependencies
```bash
# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Clean Up
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## Development Workflow

1. Make code changes in `backend/` or `frontend/`
2. Changes auto-reload in development mode
3. Test locally at http://localhost:8000
4. Test production setup: `./scripts/prod-local.sh`
5. Access production-local at http://localhost:8080
6. Deploy to production when ready

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review health checks: `docker ps`
3. Verify network: `docker network inspect drilling_dq_network`
4. Check application README: `../../README.md`

