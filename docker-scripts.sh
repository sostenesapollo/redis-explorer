#!/bin/bash

# Redis Explorer Docker Management Script

case "$1" in
  "dev")
    echo "🚀 Starting Redis Explorer in development mode..."
    docker-compose -f docker-compose.dev.yml up --build
    ;;
  "prod")
    echo "🚀 Starting Redis Explorer in production mode..."
    docker-compose up --build -d
    ;;
  "stop")
    echo "🛑 Stopping Redis Explorer..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    ;;
  "logs")
    echo "📋 Showing logs..."
    docker-compose logs -f app
    ;;
  "redis-cli")
    echo "🔧 Opening Redis CLI..."
    docker-compose exec redis redis-cli
    ;;
  "clean")
    echo "🧹 Cleaning up containers and volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    ;;
  "status")
    echo "📊 Container status:"
    docker-compose ps
    ;;
  *)
    echo "Redis Explorer Docker Management"
    echo ""
    echo "Usage: ./docker-scripts.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev      - Start in development mode with hot reload"
    echo "  prod     - Start in production mode"
    echo "  stop     - Stop all containers"
    echo "  logs     - Show application logs"
    echo "  redis-cli - Open Redis CLI"
    echo "  clean    - Clean up containers and volumes"
    echo "  status   - Show container status"
    echo ""
    echo "Examples:"
    echo "  ./docker-scripts.sh dev    # Development with hot reload"
    echo "  ./docker-scripts.sh prod   # Production deployment"
    echo "  ./docker-scripts.sh logs   # View logs"
    ;;
esac
