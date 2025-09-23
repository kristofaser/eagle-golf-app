#!/bin/bash

# Script pour générer les icônes de l'application à partir du logo SVG
# Nécessite ImageMagick : brew install imagemagick

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Chemins
LOGO_SVG="../assets/images/eagle-logo.svg"
ASSETS_DIR="../assets/images"

echo -e "${YELLOW}🎨 Génération des icônes de l'application Eagle Golf${NC}"

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick n'est pas installé${NC}"
    echo -e "${YELLOW}💡 Installation avec Homebrew:${NC}"
    echo "brew install imagemagick"
    exit 1
fi

# Vérifier si le logo SVG existe
if [ ! -f "$LOGO_SVG" ]; then
    echo -e "${RED}❌ Logo SVG non trouvé: $LOGO_SVG${NC}"
    exit 1
fi

# Créer le dossier assets si nécessaire
mkdir -p "$ASSETS_DIR"

echo -e "${YELLOW}📱 Génération de l'icône principale (1024x1024)...${NC}"
convert "$LOGO_SVG" -background white -gravity center -extent 1024x1024 "$ASSETS_DIR/icon.png"

echo -e "${YELLOW}🤖 Génération de l'icône adaptative Android (1024x1024)...${NC}"
convert "$LOGO_SVG" -background transparent -gravity center -extent 1024x1024 "$ASSETS_DIR/adaptive-icon.png"

echo -e "${YELLOW}💦 Génération de l'icône splash screen (512x512)...${NC}"
convert "$LOGO_SVG" -background transparent -gravity center -extent 512x512 "$ASSETS_DIR/splash-icon.png"

echo -e "${YELLOW}🌐 Génération du favicon (32x32)...${NC}"
convert "$LOGO_SVG" -background white -gravity center -extent 32x32 "$ASSETS_DIR/favicon.png"

# Afficher les tailles des fichiers générés
echo -e "${GREEN}✅ Icônes générées avec succès:${NC}"
ls -la "$ASSETS_DIR"/*.png | grep -E "(icon|favicon|splash)" | while read line; do
    echo -e "${GREEN}  ✓ $line${NC}"
done

echo -e "${GREEN}🎉 Génération terminée !${NC}"
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "  1. Vérifier les icônes dans $ASSETS_DIR"
echo "  2. Tester l'application: npm start"
echo "  3. Build pour voir les nouvelles icônes: npx expo build"