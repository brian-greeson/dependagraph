const path = require('path');
const fs = require('fs');
const { analyzeDependencies } = require('./analyze');
const { renderHtml } = require('./render');

function generateDependencyHtml({ targetDir, outputFile }) {
  const tree = analyzeDependencies(targetDir);
  const html = renderHtml(tree);
  const outputPath = path.resolve(targetDir, outputFile);

  fs.writeFileSync(outputPath, html, 'utf8');

  return outputPath;
}

module.exports = {
  generateDependencyHtml,
};
