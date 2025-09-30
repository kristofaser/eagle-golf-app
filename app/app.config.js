export default {
  expo: {
    // Hériter de toute la configuration existante de app.json
    ...require('./app.json').expo,

    // Configuration Android spécifique
    android: {
      // Hériter de la config Android existante
      ...require('./app.json').expo.android,

      // Ajouter la configuration Google Maps
      config: {
        googleMaps: {
          // Injecter la clé depuis .env.local
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};
