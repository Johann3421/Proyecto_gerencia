#!/bin/sh
set -e

echo "──────────────────────────────────────────"
echo "  NEXUS – Iniciando contenedor"
echo "──────────────────────────────────────────"

echo "▶ Sincronizando esquema con la base de datos..."
node_modules/.bin/prisma db push --skip-generate
echo "✅ Base de datos lista"

echo "▶ Iniciando servidor Next.js..."
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
