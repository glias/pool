const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#5c61da', '@border-radius-base': '10px' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
