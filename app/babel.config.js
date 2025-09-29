module.exports = function (api) {
  // Get the platform that Expo CLI is transforming for
  const platform = api.caller(caller => (caller ? caller.platform : 'ios'));

  // Detect if the bundling operation is for Hermes engine or not
  const engine = api.caller(caller => (caller ? caller.engine : null));

  // Is bundling for development or production
  const isDev = api.caller(caller =>
    caller
      ? caller.isDev
      : process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development'
  );

  // Invalidate cache when platform changes
  api.cache.invalidate(() => platform);

  // Log for debugging
  if (platform === 'web') {
    console.log('🌐 Babel: Configuring for Web platform');
  }

  // Plugin pour remplacer import.meta sur web
  const replaceImportMetaPlugin = function() {
    return {
      name: 'replace-import-meta',
      visitor: {
        MetaProperty(path) {
          if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
            // Remplacer import.meta.url
            if (path.parent.type === 'MemberExpression' && path.parent.property.name === 'url') {
              path.parentPath.replaceWithSourceString('"file://" + __filename');
            } else {
              // Remplacer import.meta générique
              path.replaceWithSourceString('{}');
            }
          }
        }
      }
    };
  };

  const plugins = [];

  // Ajouter le plugin de remplacement uniquement pour le web
  if (platform === 'web') {
    plugins.push(replaceImportMetaPlugin);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins.filter(Boolean),
  };
};