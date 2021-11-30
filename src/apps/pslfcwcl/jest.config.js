module.exports = {
  name: 'pslfcwcl',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/pslfcwcl',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
