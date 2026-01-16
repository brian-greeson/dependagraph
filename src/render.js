function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nodeKey(node) {
  return node.version ? `${node.name}@${node.version}` : node.name;
}

function collectSharedCounts(node, counts = new Map()) {
  if (node && node.category && node.category !== 'group' && node.category !== 'root') {
    const key = nodeKey(node);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  (node.dependencies || []).forEach((child) => collectSharedCounts(child, counts));
  return counts;
}

function renderNode(node, sharedCounts) {
  const label = node.version ? `${node.name}@${node.version}` : node.name;
  const cssClass = node.category ? `node node--${node.category}` : 'node';
  const children = node.dependencies || [];
  const sharedCount =
    node.category && node.category !== 'group' && node.category !== 'root'
      ? sharedCounts.get(nodeKey(node))
      : 0;
  const sharedBadge =
    sharedCount > 1
      ? `<span class="badge badge--shared">shared x${sharedCount}</span>`
      : '';

  const childMarkup = children.length
    ? `<ul class="node-children">${children
        .map((child) => renderNode(child, sharedCounts))
        .join('')}</ul>`
    : '';

  return `
    <li>
      <div class="node-row">
        <button class="${cssClass} node-toggle" type="button" ${
          children.length ? 'aria-expanded="true"' : 'aria-expanded="false"'
        } ${children.length ? '' : 'data-has-children="false"'}>
          <span class="node-label">${escapeHtml(label)}</span>
          ${sharedBadge}
        </button>
      </div>
      ${childMarkup}
    </li>
  `;
}

function renderHtml(tree) {
  const sharedCounts = collectSharedCounts(tree);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dependency Graph</title>
    <style>
      body {
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background: #f2f4f8;
        color: #1f2328;
        margin: 0;
        padding: 32px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 26px;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 24px;
        font-size: 14px;
      }

      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }

      .node-row {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
      }

      .node {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #d0d7de;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        font-size: 13px;
        color: inherit;
        cursor: pointer;
        position: relative;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .node[data-has-children="false"] {
        cursor: default;
      }

      .node:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      }

      .node-label {
        font-weight: 600;
      }

      .node-toggle::before {
        content: "▾";
        display: inline-block;
        transition: transform 0.15s ease;
        font-size: 12px;
      }

      li.is-collapsed > .node-row .node-toggle::before {
        transform: rotate(-90deg);
      }

      .node[data-has-children="false"]::before {
        content: "•";
        font-size: 10px;
        color: #94a3b8;
      }

      .badge {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.06);
        color: #475569;
      }

      .badge--shared {
        background: rgba(234, 179, 8, 0.2);
        color: #92400e;
      }

      .node--dependency {
        border-color: #1f6feb;
        background: linear-gradient(90deg, rgba(31, 111, 235, 0.14), #ffffff);
      }

      .node--devDependency {
        border-color: #bf3989;
        background: linear-gradient(90deg, rgba(191, 57, 137, 0.14), #ffffff);
      }

      .node--group {
        border-color: #6e7781;
        background: linear-gradient(90deg, rgba(110, 119, 129, 0.18), #ffffff);
        font-weight: 600;
      }

      ul {
        list-style: none;
        margin: 18px 0 18px 36px;
        padding: 0;
        position: relative;
      }

      ul::before {
        content: "";
        position: absolute;
        top: 0;
        left: -18px;
        width: 2px;
        height: 100%;
        background: linear-gradient(180deg, rgba(148, 163, 184, 0.6), rgba(148, 163, 184, 0.1));
      }

      li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 14px;
      }

      li::before {
        content: "";
        position: absolute;
        top: 18px;
        left: -18px;
        width: 18px;
        height: 2px;
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.6), rgba(148, 163, 184, 0.1));
      }

      li.is-collapsed > ul {
        display: none;
      }

      .instructions {
        margin: 0 0 20px;
        color: #475569;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <h1>Dependency Tree</h1>
    <p class="instructions">Click any node to collapse or expand its dependencies. Shared sub-dependencies are highlighted so you can quickly spot overlap.</p>
    <div class="legend">
      <span><span class="dot" style="background:#1f6feb"></span>Dependency</span>
      <span><span class="dot" style="background:#bf3989"></span>Dev Dependency</span>
      <span><span class="dot" style="background:#6e7781"></span>Group</span>
      <span><span class="dot" style="background:#facc15"></span>Shared sub-dependency</span>
    </div>
    <ul>
      ${renderNode(tree, sharedCounts)}
    </ul>
    <script>
      document.addEventListener('click', (event) => {
        const toggle = event.target.closest('.node-toggle');
        if (!toggle || toggle.dataset.hasChildren === 'false') {
          return;
        }

        const listItem = toggle.closest('li');
        if (!listItem) {
          return;
        }

        listItem.classList.toggle('is-collapsed');
        toggle.setAttribute(
          'aria-expanded',
          String(!listItem.classList.contains('is-collapsed')),
        );
      });
    </script>
  </body>
</html>`;
}

module.exports = {
  renderHtml,
};
