const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPackageJson(targetDir) {
  const packagePath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error(`No package.json found at ${packagePath}`);
  }
  return readJson(packagePath);
}

function readLockfile(targetDir) {
  const lockPath = path.join(targetDir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    return null;
  }
  return readJson(lockPath);
}

function collectTopLevelDependencies(packageJson) {
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  return {
    dependencies,
    devDependencies,
  };
}

function buildTreeFromLockfile(lockfile, topLevel) {
  if (!lockfile) {
    return null;
  }

  if (lockfile.packages) {
    return buildTreeFromPackages(lockfile, topLevel);
  }

  if (lockfile.dependencies) {
    return buildTreeFromDependencies(lockfile, topLevel);
  }

  return null;
}

function buildTreeFromPackages(lockfile, topLevel) {
  const packages = lockfile.packages || {};
  const root = packages[''] || {};
  const rootDeps = root.dependencies || {};
  const rootDevDeps = root.devDependencies || {};

  function buildNode(name, version, category) {
    const pkgPath = `node_modules/${name}`;
    const entry = packages[pkgPath] || {};
    const dependencies = entry.dependencies || {};

    return {
      name,
      version: version || entry.version || 'unknown',
      category,
      dependencies: Object.entries(dependencies).map(([depName, depVersion]) =>
        buildNode(depName, depVersion, 'dependency'),
      ),
    };
  }

  return {
    name: 'project',
    version: root.version || '',
    category: 'root',
    dependencies: [
      {
        name: 'dependencies',
        category: 'group',
        dependencies: Object.entries(rootDeps).map(([name, version]) =>
          buildNode(name, version, 'dependency'),
        ),
      },
      {
        name: 'devDependencies',
        category: 'group',
        dependencies: Object.entries(rootDevDeps).map(([name, version]) =>
          buildNode(name, version, 'devDependency'),
        ),
      },
    ],
  };
}

function buildTreeFromDependencies(lockfile, topLevel) {
  const rootDeps = topLevel.dependencies;
  const rootDevDeps = topLevel.devDependencies;

  function buildNode(name, version, category, entry) {
    const dependencies = (entry && entry.dependencies) || {};
    return {
      name,
      version: version || (entry && entry.version) || 'unknown',
      category,
      dependencies: Object.entries(dependencies).map(([depName, depEntry]) =>
        buildNode(depName, depEntry.version, 'dependency', depEntry),
      ),
    };
  }

  return {
    name: 'project',
    version: lockfile.version || '',
    category: 'root',
    dependencies: [
      {
        name: 'dependencies',
        category: 'group',
        dependencies: Object.entries(rootDeps).map(([name, version]) =>
          buildNode(name, version, 'dependency', lockfile.dependencies?.[name]),
        ),
      },
      {
        name: 'devDependencies',
        category: 'group',
        dependencies: Object.entries(rootDevDeps).map(([name, version]) =>
          buildNode(
            name,
            version,
            'devDependency',
            lockfile.dependencies?.[name],
          ),
        ),
      },
    ],
  };
}

function runNpmLs(targetDir) {
  try {
    return execSync('npm ls --json --all', {
      cwd: targetDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).toString();
  } catch (error) {
    if (error && error.stdout) {
      return error.stdout.toString();
    }
    throw error;
  }
}

function buildTreeFromNpmLs(targetDir, topLevel) {
  const output = runNpmLs(targetDir);

  const data = JSON.parse(output);

  function buildNode(name, entry, category) {
    if (!entry) {
      return { name, version: 'unknown', category, dependencies: [] };
    }

    const dependencies = entry.dependencies || {};

    return {
      name,
      version: entry.version || 'unknown',
      category,
      dependencies: Object.entries(dependencies).map(([depName, depEntry]) =>
        buildNode(depName, depEntry, 'dependency'),
      ),
    };
  }

  return {
    name: data.name || 'project',
    version: data.version || '',
    category: 'root',
    dependencies: [
      {
        name: 'dependencies',
        category: 'group',
        dependencies: Object.entries(topLevel.dependencies).map(([name]) =>
          buildNode(name, data.dependencies?.[name], 'dependency'),
        ),
      },
      {
        name: 'devDependencies',
        category: 'group',
        dependencies: Object.entries(topLevel.devDependencies).map(([name]) =>
          buildNode(name, data.dependencies?.[name], 'devDependency'),
        ),
      },
    ],
  };
}

function analyzeDependencies(targetDir) {
  const packageJson = getPackageJson(targetDir);
  const topLevel = collectTopLevelDependencies(packageJson);
  const lockfile = readLockfile(targetDir);
  const treeFromLockfile = buildTreeFromLockfile(lockfile, topLevel);

  if (treeFromLockfile) {
    return treeFromLockfile;
  }

  return buildTreeFromNpmLs(targetDir, topLevel);
}

module.exports = {
  analyzeDependencies,
};
