const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Only watch the mobile directory, not the monorepo root
config.watchFolders = [__dirname];

module.exports = config;
