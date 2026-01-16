const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { analyzeDependencies } = require('../src/analyze.js');

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function withTempDir(callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dependagraph-'));
  try {
    return callback(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test('analyzeDependencies builds a tree from lockfile packages metadata', () =>
  withTempDir((tempDir) => {
    writeJson(path.join(tempDir, 'package.json'), {
      name: 'sample-project',
      version: '1.0.0',
      dependencies: { foo: '^1.0.0' },
      devDependencies: { bar: '^2.0.0' },
    });

    writeJson(path.join(tempDir, 'package-lock.json'), {
      name: 'sample-project',
      version: '1.0.0',
      packages: {
        '': {
          version: '1.0.0',
          dependencies: { foo: '1.0.0' },
          devDependencies: { bar: '2.0.0' },
        },
        'node_modules/foo': {
          version: '1.0.0',
          dependencies: { baz: '3.0.0' },
        },
        'node_modules/baz': {
          version: '3.0.0',
        },
        'node_modules/bar': {
          version: '2.0.0',
        },
      },
    });

    const tree = analyzeDependencies(tempDir);

    assert.equal(tree.name, 'project');
    assert.equal(tree.category, 'root');

    const [depsGroup, devDepsGroup] = tree.dependencies;
    assert.equal(depsGroup.name, 'dependencies');
    assert.equal(devDepsGroup.name, 'devDependencies');

    const fooNode = depsGroup.dependencies[0];
    assert.equal(fooNode.name, 'foo');
    assert.equal(fooNode.version, '1.0.0');
    assert.equal(fooNode.dependencies[0].name, 'baz');

    const barNode = devDepsGroup.dependencies[0];
    assert.equal(barNode.name, 'bar');
    assert.equal(barNode.version, '2.0.0');
  }));

test('analyzeDependencies builds a tree from legacy lockfile dependencies', () =>
  withTempDir((tempDir) => {
    writeJson(path.join(tempDir, 'package.json'), {
      name: 'legacy-project',
      version: '0.1.0',
      dependencies: { alpha: '^1.0.0' },
      devDependencies: { beta: '^2.0.0' },
    });

    writeJson(path.join(tempDir, 'package-lock.json'), {
      name: 'legacy-project',
      version: '0.1.0',
      lockfileVersion: 1,
      dependencies: {
        alpha: {
          version: '1.2.3',
          dependencies: {
            gamma: {
              version: '3.0.0',
            },
          },
        },
        beta: {
          version: '2.4.0',
        },
      },
    });

    const tree = analyzeDependencies(tempDir);
    const [depsGroup, devDepsGroup] = tree.dependencies;

    assert.equal(depsGroup.dependencies[0].name, 'alpha');
    assert.equal(depsGroup.dependencies[0].dependencies[0].name, 'gamma');
    assert.equal(devDepsGroup.dependencies[0].name, 'beta');
  }));
