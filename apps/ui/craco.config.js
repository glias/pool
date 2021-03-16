const CracoLessPlugin = require('craco-less');

module.exports = {
  babel: {
    plugins: ['babel-plugin-styled-components'],
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#5c61da' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
