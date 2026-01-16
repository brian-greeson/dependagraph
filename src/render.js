function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNode(node) {
  const label = node.version ? `${node.name}@${node.version}` : node.name;
  const cssClass = node.category ? `node node--${node.category}` : 'node';
  const children = node.dependencies || [];

  const childMarkup = children.length
    ? `<ul>${children.map(renderNode).join('')}</ul>`
    : '';

  return `
    <li>
      <div class="${cssClass}">${escapeHtml(label)}</div>
      ${childMarkup}
    </li>
  `;
}

function renderHtml(tree) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dependency Graph</title>
    <style>
      body {
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background: #f6f7fb;
        color: #1f2328;
        margin: 0;
        padding: 32px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 24px;
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

      .node {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 6px;
        background: #ffffff;
        border: 1px solid #d0d7de;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        font-size: 13px;
      }

      .node--dependency {
        border-color: #1f6feb;
        background: #e7f1ff;
      }

      .node--devDependency {
        border-color: #bf3989;
        background: #fde9f4;
      }

      .node--group {
        border-color: #6e7781;
        background: #f0f2f5;
        font-weight: 600;
      }

      ul {
        list-style: none;
        margin: 12px 0 12px 24px;
        padding: 0;
        position: relative;
      }

      ul::before {
        content: "";
        position: absolute;
        top: 0;
        left: -12px;
        width: 1px;
        height: 100%;
        background: #d0d7de;
      }

      li {
        position: relative;
        padding-left: 12px;
      }

      li::before {
        content: "";
        position: absolute;
        top: 14px;
        left: -12px;
        width: 12px;
        height: 1px;
        background: #d0d7de;
      }
    </style>
  </head>
  <body>
    <h1>Dependency Tree</h1>
    <div class="legend">
      <span><span class="dot" style="background:#1f6feb"></span>Dependency</span>
      <span><span class="dot" style="background:#bf3989"></span>Dev Dependency</span>
      <span><span class="dot" style="background:#6e7781"></span>Group</span>
    </div>
    <ul>
      ${renderNode(tree)}
    </ul>
  </body>
</html>`;
}

module.exports = {
  renderHtml,
};
