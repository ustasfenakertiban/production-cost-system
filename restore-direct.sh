#!/bin/bash

# Load env vars
export $(grep -v '^#' app/.env | xargs)

# Parse DATABASE_URL
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
    PGUSER="${BASH_REMATCH[1]}"
    PGPASSWORD="${BASH_REMATCH[2]}"
    PGHOST="${BASH_REMATCH[3]}"
    PGPORT="${BASH_REMATCH[4]}"
    PGDATABASE="${BASH_REMATCH[5]}"
    
    echo "Restoring to: $PGHOST:$PGPORT/$PGDATABASE as $PGUSER"
    
    export PGPASSWORD
    
    BACKUP_FILE="${1:-./backups/backup_20251006_000001.sql}"
    
    echo "Restoring from: $BACKUP_FILE"
    
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "Restore completed successfully!"
    else
        echo "Restore failed!"
        exit 1
    fi
else
    echo "Invalid DATABASE_URL format"
    exit 1
fi
