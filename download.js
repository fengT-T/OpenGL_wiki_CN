const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

function collectUrls(nodes) {
  const urls = [];
  for (const node of nodes) {
    urls.push({ title: node.title, url: node.url.trim() });
    if (node.children) {
      urls.push(...collectUrls(node.children));
    }
  }
  return urls;
}

const allUrls = collectUrls(data);
console.log(`Total URLs to download: ${allUrls.length}`);

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
  pragma: "no-cache",
  priority: "u=0, i",
  "sec-ch-ua": '"Not-A.Brand";v="24", "Chromium";v="146"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Linux"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  cookie:
    "khr__cookies_allowed=y; cf_clearance=evSQQH3Et8KQJIk8MeuPq7aBElGA377mviXGX431GEo-1774253870-1.2.1.1-6Iq_PK2_LBoUIiHusScZ38mOTJ3sqfyNXfc_j5WoLeBm1fvRetQxYv.osIipLF26Czh53O6QViET_nodKGazCKiEUpnu4KqKXoYKhOLodFvBHSbw3Z51jP0qHUOYGR5t397xh2YsbKjW.RPskJER_KyNNqiJ4JCFub61uWBhPF5KrUtiwh7wJW26Oyc1mmxBZ1fZeCWJEa13ofirqvl40giCCnuswnQXqIswgaE.VNfweWOAEtKC5gzPRFpTIGjD",
  Referer:
    "https://wikis.khronos.org/opengl/Core_Language_(GLSL)?__cf_chl_tk=YQuBQANrhtsRGSQfiF1Muv2faAKZYe8UQQdH.dnBb9k-1774253865-1.0.1.1-OE8xUW.2HlTpuy2pDesBNz.pjBU_YzmcSFOUVgZr7g4",
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
};

async function downloadPage(url, title, index) {
  const filename =
    url
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9_-]/g, "_") + ".html";
  const filepath = path.join("data", filename);

  if (fs.existsSync(filepath)) {
    console.log(
      `[${index + 1}/${allUrls.length}] Skipping ${title} (already exists)`,
    );
    return;
  }

  console.log(`[${index + 1}/${allUrls.length}] Downloading ${title}...`);

  try {
    const response = await fetch(url, {
      headers: headers,
      // referrer: "https://wikis.khronos.org/opengl/Main_Page",
      body: null,
      method: "GET",
      // mode: "cors",
      // credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    fs.writeFileSync(filepath, html);
    console.log(`  ✓ Saved to ${filepath}`);
  } catch (error) {
    console.error(`  ✗ Error downloading ${title}: ${error.message}`);
  }
}

async function downloadAll() {
  for (let i = 0; i < allUrls.length; i++) {
    await downloadPage(allUrls[i].url, allUrls[i].title, i);
    if (i < allUrls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log("\nDownload complete!");
}

downloadAll();
