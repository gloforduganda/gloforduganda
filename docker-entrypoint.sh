#!/bin/sh
set -e
# Ensure uploads directory exists
mkdir -p /app/uploads
# Fix ownership after Docker volume mount (volumes mount as root:root).
# This succeeds on standard Docker (root UID inside container).
chown -R nextjs:nodejs /app/uploads 2>/dev/null || true
# Ensure directory is writable even if chown was skipped (rootless Docker).
chmod 775 /app/uploads 2>/dev/null || true
# Drop to non-root user and exec the main process
exec su-exec nextjs "$@"
