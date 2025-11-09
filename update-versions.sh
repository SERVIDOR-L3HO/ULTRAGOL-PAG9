#!/bin/bash
# Script para actualizar versiones de cache busting
VERSION="20251109"

# Lista de archivos HTML a actualizar
FILES="index.html standings.html teams.html calendario.html estadisticas.html donaciones.html noticias.html partido-live.html team-profile.html"

for file in $FILES; do
  if [ -f "$file" ]; then
    echo "Actualizando $file..."
    # Actualizar referencias CSS y JS que ya tienen versión
    sed -i "s/\.css?v=[0-9]*/\.css?v=$VERSION/g" "$file"
    sed -i "s/\.js?v=[0-9]*/\.js?v=$VERSION/g" "$file"
    
    # Agregar versión a archivos CSS sin ella
    sed -i 's/\(href="css\/[^"]*\.css\)"/\1?v='$VERSION'"/g' "$file"
    
    # Agregar versión a archivos JS sin ella (excluyendo CDNs externos)
    sed -i 's/\(src="js\/[^"]*\.js\)"/\1?v='$VERSION'"/g' "$file"
    
    echo "✅ $file actualizado"
  fi
done

echo "🎉 Todas las versiones actualizadas a v=$VERSION"
