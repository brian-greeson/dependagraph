#!/usr/bin/env node

const path = require('path');
const { generateDependencyHtml } = require('../src/index');

function parseArgs(args) {
  const options = {
    targetDir: process.cwd(),
    outputFile: 'dependagraph.html',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      break;
    }

    if (arg === '--output' || arg === '-o') {
      options.outputFile = args[i + 1] || options.outputFile;
      i += 1;
      continue;
    }

    if (!arg.startsWith('-')) {
      options.targetDir = path.resolve(arg);
    }
  }

  return options;
}

function printHelp() {
  console.log(`dependagraph - generate an HTML dependency tree

Usage:
  dependagraph [project-path] [--output <file>]

Options:
  -o, --output   Output file name (default: dependagraph.html)
  -h, --help     Show this help text
`);
}

function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const outputPath = generateDependencyHtml(options);
  console.log(`Dependency tree written to ${outputPath}`);
}

run();
