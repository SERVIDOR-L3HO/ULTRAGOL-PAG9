#!/bin/bash
# Script para actualizar versiones de cache busting en TODOS los archivos HTML
VERSION="20251109c"

echo "🔄 Actualizando versiones a v=$VERSION..."
echo ""

# Encontrar TODOS los archivos HTML (raíz y carpetas)
find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
  echo "📝 Procesando: $file"
  
  # Actualizar referencias CSS y JS que ya tienen versión
  sed -i "s/\.css?v=[^\"']*/\.css?v=$VERSION/g" "$file"
  sed -i "s/\.js?v=[^\"']*/\.js?v=$VERSION/g" "$file"
  
  # Agregar versión a archivos CSS locales sin ella (excluyendo CDNs)
  sed -i 's|\(href="\)\([^"http][^"]*\.css\)\(["?]\)|\1\2?v='$VERSION'\3|g' "$file"
  sed -i "s|\(href='\)\([^'http][^']*\.css\)\(['?]\)|\1\2?v=$VERSION\3|g" "$file"
  
  # Agregar versión a archivos JS locales sin ella (excluyendo CDNs)
  sed -i 's|\(src="\)\([^"http][^"]*\.js\)\(["?]\)|\1\2?v='$VERSION'\3|g' "$file"
  sed -i "s|\(src='\)\([^'http][^']*\.js\)\(['?]\)|\1\2?v=$VERSION\3|g" "$file"
  
  echo "✅ $file actualizado"
  echo ""
done

echo ""
echo "🎉 Todas las versiones actualizadas a v=$VERSION"
echo "📁 Archivos actualizados en:"
echo "   - Raíz del proyecto"
echo "   - ULTRA/"
echo "   - ULTRACANALES/"
echo "   - live-chat/"
echo ""
echo "⚡ Siguiente paso: git add . && git commit -m 'Update cache v$VERSION' && git push"
