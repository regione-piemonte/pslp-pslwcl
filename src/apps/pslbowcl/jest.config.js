module.exports = {
  name: 'pslbowcl',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/pslbowcl',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
