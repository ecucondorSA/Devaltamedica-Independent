#!/bin/bash
# Manual GitHub Setup Script

echo "======================================"
echo "📋 CONFIGURACIÓN MANUAL DE GITHUB"
echo "======================================"
echo ""
echo "1. Ve a: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Agrega estos secrets (copia los valores de .env.local):"
echo ""
cat .env.local | while read line; do
  if [[ ! -z "$line" ]]; then
    KEY=$(echo $line | cut -d'=' -f1)
    echo "   • $KEY"
  fi
done
echo ""
echo "3. Ve a: https://github.com/YOUR_USERNAME/YOUR_REPO/labels"
echo ""
echo "4. Crea estos labels:"
cat .github/labels.json | grep '"name"' | cut -d'"' -f4 | while read label; do
  echo "   • $label"
done
echo ""
echo "======================================"
