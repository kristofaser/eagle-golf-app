const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimisations pour les performances
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  keep_classnames: true,
  keep_fnames: true,
};

// Optimisation pour les grandes applications
config.resolver.sourceExts.push('cjs');

// Support des fichiers SVG si nécessaire
// config.resolver.assetExts.push('svg');

module.exports = config;
