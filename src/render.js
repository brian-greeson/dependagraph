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

function collectSharedOwners(node, owners = new Map()) {
  if (!node) {
    return owners;
  }

  const isPackage = node.category && node.category !== 'group' && node.category !== 'root';
  const parentLabel = isPackage ? nodeKey(node) : null;

  (node.dependencies || []).forEach((child) => {
    const isChildPackage =
      child && child.category && child.category !== 'group' && child.category !== 'root';

    if (parentLabel && isChildPackage) {
      const key = nodeKey(child);
      const list = owners.get(key) || new Set();
      list.add(parentLabel);
      owners.set(key, list);
    }

    collectSharedOwners(child, owners);
  });

  return owners;
}

function renderNode(node, sharedCounts, sharedOwners) {
  const label = node.version ? `${node.name}@${node.version}` : node.name;
  const cssClass = node.category ? `node node--${node.category}` : 'node';
  const children = node.dependencies || [];
  const sharedCount =
    node.category && node.category !== 'group' && node.category !== 'root'
      ? sharedCounts.get(nodeKey(node))
      : 0;
  const owners = sharedOwners.get(nodeKey(node));
  const ownerList = owners ? Array.from(owners).sort().join(', ') : '';
  const sharedTooltip = ownerList ? `Shared by: ${ownerList}` : 'Shared dependency';
  const sharedBadge =
    sharedCount > 1
      ? `<span class="badge badge--shared" data-tooltip="${escapeHtml(
          sharedTooltip,
        )}">shared x${sharedCount}</span>`
      : '';

  const childMarkup = children.length
    ? `<ul class="node-children">${children
        .map((child) => renderNode(child, sharedCounts, sharedOwners))
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
  const sharedOwners = collectSharedOwners(tree);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dependency Graph</title>
    <style>
      body {
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        margin: 0;
        padding: 24px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 20px;
        letter-spacing: -0.02em;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
        font-size: 12px;
        color: #475569;
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
        gap: 6px;
        position: relative;
      }

      .node {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
        font-size: 12px;
        color: inherit;
        cursor: pointer;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }

      .node[data-has-children="false"] {
        cursor: default;
      }

      .node:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      }

      .node-label {
        font-weight: 600;
      }

      .node-toggle::before {
        content: "▾";
        display: inline-block;
        transition: transform 0.2s ease;
        font-size: 10px;
      }

      li.is-collapsed > .node-row .node-toggle::before {
        transform: rotate(-90deg);
      }

      .node[data-has-children="false"]::before {
        content: "•";
        font-size: 9px;
        color: #94a3b8;
      }

      .badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.06);
        color: #475569;
      }

      .badge--shared {
        background: rgba(234, 179, 8, 0.18);
        color: #92400e;
        position: relative;
      }

      .node--dependency {
        border-color: rgba(30, 64, 175, 0.25);
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.12), #ffffff);
      }

      .node--devDependency {
        border-color: rgba(190, 24, 93, 0.22);
        background: linear-gradient(90deg, rgba(244, 114, 182, 0.16), #ffffff);
      }

      .node--group {
        border-color: #cbd5f5;
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.14), #ffffff);
        font-weight: 600;
      }

      ul {
        list-style: none;
        margin: 10px 0 10px 20px;
        padding: 0;
        position: relative;
      }

      ul::before {
        content: "";
        position: absolute;
        top: 0;
        left: -12px;
        width: 2px;
        height: 100%;
        background: linear-gradient(180deg, rgba(148, 163, 184, 0.4), rgba(148, 163, 184, 0.08));
      }

      li {
        position: relative;
        padding-left: 12px;
        margin-bottom: 8px;
      }

      li::before {
        content: "";
        position: absolute;
        top: 14px;
        left: -12px;
        width: 12px;
        height: 2px;
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.4), rgba(148, 163, 184, 0.08));
      }

      li.is-collapsed > ul {
        max-height: 0;
        opacity: 0;
        margin: 0 0 0 20px;
        pointer-events: none;
      }

      .node-children {
        max-height: 2000px;
        opacity: 1;
        overflow: hidden;
        transition: max-height 0.25s ease, opacity 0.25s ease, margin 0.25s ease;
      }

      .badge--shared:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        top: 120%;
        left: 0;
        background: #0f172a;
        color: #f8fafc;
        padding: 6px 8px;
        border-radius: 8px;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
        z-index: 2;
      }

      .instructions {
        margin: 0 0 12px;
        color: #64748b;
        font-size: 12px;
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
      ${renderNode(tree, sharedCounts, sharedOwners)}
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
