const fs = require("fs");
const path = require("path");

const linkContent = fs.readFileSync("link.md", "utf8");
const lines = linkContent.split("\n");

const result = [];
const stack = [{ children: result, level: -1 }];

for (const line of lines) {
  if (!line.trim()) continue;

  const match = line.match(/^(\s*)\*\s*\[([^\]]+)\]\((.+?)\s+"([^"]+)"\)/);
  if (!match) {
    const headerMatch = line.match(
      /^##\s*\[([^\]]+)\]\((.+?)\s+"([^"]+)"\)/,
    );
    if (headerMatch) {
      const [, title, url, alt] = headerMatch;
      const item = {
        title: title,
        url: url.trim(),
        alt: alt,
        children: [],
      };
      result.push(item);
      stack.length = 0;
      stack.push({ children: result, level: -1 });
      stack.push({ item, level: 0, children: item.children });
    }
    continue;
  }
  const [, indent, title, url, alt] = match;
  const level = indent.length / 2;

  const item = {
    title: title,
    url: url.trim(),
    alt: alt,
    children: [],
  };

  while (stack.length > 1 && stack[stack.length - 1].level >= level) {
    stack.pop();
  }

  const parent = stack[stack.length - 1];
  parent.children.push(item);
  stack.push({ item, level, children: item.children });
}

function cleanEmptyChildren(node) {
  if (node.children && node.children.length === 0) {
    delete node.children;
  } else if (node.children) {
    node.children.forEach(cleanEmptyChildren);
  }
}

result.forEach(cleanEmptyChildren);

fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
console.log("data.json created successfully!");

function collectUrls(nodes) {
  const urls = [];
  for (const node of nodes) {
    urls.push({ title: node.title, url: node.url });
    if (node.children) {
      urls.push(...collectUrls(node.children));
    }
  }
  return urls;
}

const allUrls = collectUrls(result);
console.log(`Total URLs to download: ${allUrls.length}`);
