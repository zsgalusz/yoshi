const path = require('path');
const loadTemplate = require('../src/loadTemplate');

test('should return a list of template definitions', () => {
  expect(
    loadTemplate(path.join(__dirname, './__fixtures__/extended-template')),
  ).toEqual(
    expect.objectContaining({
      extends: expect.any(String),
      name: expect.any(String),
      path: expect.any(String),
    }),
  );
});

test('should throw an error if a path was listed but was not exist', () => {
  expect(() =>
    loadTemplate(
      path.join(__dirname, './__fixtures__/template-that-does-not-exist'),
    ),
  ).toThrowError(/the following template directory does not exist:/);
});

test('should throw an error if a path was listed but there was no config file', () => {
  expect(() =>
    loadTemplate(
      path.join(__dirname, './__fixtures__/template-without-config'),
    ),
  ).toThrowError(/all templates must contain a config file/);
});
