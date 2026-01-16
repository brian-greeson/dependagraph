const assert = require('node:assert/strict');
const { test } = require('node:test');

const { renderHtml } = require('../src/render');

test('renderHtml escapes node labels and renders groups', () => {
  const tree = {
    name: 'project',
    version: '1.0.0',
    category: 'root',
    dependencies: [
      {
        name: 'dependencies',
        category: 'group',
        dependencies: [
          {
            name: '<script>alert(1)</script>',
            version: '2.0.0',
            category: 'dependency',
            dependencies: [],
          },
        ],
      },
    ],
  };

  const html = renderHtml(tree);

  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;@2\.0\.0/);
  assert.match(html, /node--group/);
  assert.match(html, /Dependency Tree/);
});
