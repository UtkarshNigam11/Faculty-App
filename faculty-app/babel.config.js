module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router transforms
      'expo-router/babel',
      // Must be last: enables Reanimated worklets and transforms
      'react-native-reanimated/plugin',
    ],
  };
};