diff --git a/readme.md b/readme.md
index e69de29bb2d1d6434b8b29ae775ad8c2e48c5391..7cae518f306c8d2d78cd9b15cc594495687aaca7 100644
--- a/readme.md
+++ b/readme.md
@@ -0,0 +1,25 @@
+# Dependagraph
+
+Dependagraph generates an HTML report that visualizes the dependency tree of a Node.js project. It starts with the project’s `dependencies` and `devDependencies` from `package.json`, then drills into the sub-dependencies using the lockfile when available.
+
+## Usage
+
+```bash
+npm install -g dependagraph
+```
+
+```bash
+dependagraph /path/to/project --output dependency-tree.html
+```
+
+The command writes an HTML file (default: `dependagraph.html`) inside the target project folder.
+
+## How it works
+
+- Reads `package.json` to identify top-level dependencies.
+- Uses `package-lock.json` if present to resolve full dependency trees.
+- Falls back to `npm ls --json --all` if no lockfile exists.
+
+## Output
+
+Open the generated HTML file in a browser to explore the dependency tree.
