module.exports = {
  name: 'pslphome',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/pslphome',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
