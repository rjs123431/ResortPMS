#!/bin/bash

# Helper script for Entity Framework Core migrations
# Usage:
#   ./app migration add "MigrationName"
#   ./app migration remove
#   ./app db update
#   ./app db drop

PROJECT_DIR="aspnet-core/src/PMS.EntityFrameworkCore"
STARTUP_PROJECT="aspnet-core/src/PMS.Web.Host"

cd "$(dirname "$0")"

case "$1" in
    migration)
        case "$2" in
            add)
                if [ -z "$3" ]; then
                    echo "Error: Migration name is required"
                    echo "Usage: ./app migration add \"MigrationName\""
                    exit 1
                fi
                cd "$PROJECT_DIR"
                dotnet ef migrations add "$3" --startup-project "../PMS.Web.Host"
                ;;
            remove)
                cd "$PROJECT_DIR"
                dotnet ef migrations remove --startup-project "../PMS.Web.Host" --force
                ;;
            list)
                cd "$PROJECT_DIR"
                dotnet ef migrations list --startup-project "../PMS.Web.Host"
                ;;
            *)
                echo "Usage:"
                echo "  ./app migration add \"MigrationName\""
                echo "  ./app migration remove"
                echo "  ./app migration list"
                exit 1
                ;;
        esac
        ;;
    db)
        case "$2" in
            update)
                cd "$PROJECT_DIR"
                dotnet ef database update --startup-project "../PMS.Web.Host"
                ;;
            drop)
                cd "$PROJECT_DIR"
                dotnet ef database drop --startup-project "../PMS.Web.Host" --force
                ;;
            reset)
                echo "Dropping and recreating database..."
                cd "$PROJECT_DIR"
                dotnet ef database drop --startup-project "../PMS.Web.Host" --force
                dotnet ef database update --startup-project "../PMS.Web.Host"
                ;;
            *)
                echo "Usage:"
                echo "  ./app db update"
                echo "  ./app db drop"
                echo "  ./app db reset"
                exit 1
                ;;
        esac
        ;;
    start)
        echo "Starting Angular development server..."
        cd "$(dirname "$0")/angular"
        yarn start
        ;;
    sp)
        case "$2" in
            update)
                echo "Updating service proxies..."
                cd "$(dirname "$0")/angular"
                yarn nswag:mac
                ;;
            *)
                echo "Usage:"
                echo "  ./app sp update  - Update service proxies (NSwag)"
                exit 1
                ;;
        esac
        ;;
    build)
        case "$2" in
            prod)
                echo "Building for production..."
                cd "$(dirname "$0")/aspnet-core/build"
                if [ -f "./prod" ]; then
                    bash ./prod
                elif [ -f "./prod.ps1" ]; then
                    pwsh -ExecutionPolicy Bypass -File ./prod.ps1
                else
                    echo "Error: prod script not found"
                    exit 1
                fi
                ;;
            docs)
                echo "Building documentation..."
                cd "$(dirname "$0")/docs"
                if command -v retype &> /dev/null; then
                    retype build
                    echo "Documentation built successfully in docs/.build folder"
                else
                    echo "Error: retype is not installed"
                    echo "Please install it with: npm install retypeapp --global"
                    exit 1
                fi
                ;;
            *)
                echo "Usage:"
                echo "  ./app build prod   - Build for production"
                echo "  ./app build docs   - Build documentation"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "PMS Management CLI"
        echo ""
        echo "Usage:"
        echo "  ./app migration add \"MigrationName\"  - Add a new migration"
        echo "  ./app migration remove                - Remove last migration"
        echo "  ./app migration list                  - List all migrations"
        echo "  ./app db update                       - Update database"
        echo "  ./app db drop                         - Drop database"
        echo "  ./app db reset                        - Drop and recreate database"
        echo "  ./app start                           - Start Angular development server"
        echo "  ./app sp update                       - Update service proxies (NSwag)"
        echo "  ./app build prod                      - Build for production"
        echo "  ./app build docs                      - Build documentation"
        exit 1
        ;;
esac
