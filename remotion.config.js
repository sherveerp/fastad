// remotion.config.js
require('dotenv').config(); // ensure .env(.local) is loaded

const webpack = require('webpack');

module.exports = {
  // This function lets you tweak Remotion’s webpack config
  webpackOverride: (config) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        // Bake your real SUPABASE URL into the bundle
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
          process.env.NEXT_PUBLIC_SUPABASE_URL
        ),
      })
    );
    return config;
  },
};
