const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Retirer le custom transformer qui cause des problèmes
// On va plutôt utiliser experimentalImportSupport

// Optimisations pour les performances
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  keep_classnames: true,
  keep_fnames: true,
};

// Configuration spécifique pour le web - Désactiver complètement Hermes
if (process.env.EXPO_PUBLIC_PLATFORM === 'web' || process.argv.includes('--web')) {
  // Force l'utilisation du parser JS standard pour le web
  config.transformer.hermesParser = false;
  config.transformer.enableBabelRCLookup = false;

  console.log('🌐 Metro: Configuration Web activée (Hermes désactivé)');
} else {
  // Pour mobile, on peut utiliser Hermes si souhaité
  config.transformer.hermesParser = true;
}

// Configuration importante pour le web - Désactiver la transformation import/export
config.transformer.getTransformOptions = async () => ({
  transform: {
    // Cette option empêche la transformation des imports/exports en CommonJS
    // Crucial pour éviter les problèmes avec import.meta sur web
    experimentalImportSupport: true,
    inlineRequires: false,
  },
});

// Support des extensions plateforme-spécifiques pour le web
config.resolver.platforms = ['native', 'web', 'android', 'ios'];
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js'
];

// Résolution personnalisée pour les modules natifs sur web (API officielle Expo)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Vider les modules natifs sur web
  if (platform === 'web') {
    if (moduleName === '@stripe/stripe-react-native' ||
        moduleName === 'react-native-maps' ||
        moduleName.includes('@stripe/stripe-react-native') ||
        moduleName.includes('react-native-maps')) {
      return {
        type: 'empty',
      };
    }
  }

  // Toujours appeler le résolveur par défaut
  return context.resolveRequest(context, moduleName, platform);
};


// Optimisation pour les grandes applications
config.resolver.sourceExts.push('cjs');

// Support des fichiers SVG si nécessaire
// config.resolver.assetExts.push('svg');

module.exports = config;
