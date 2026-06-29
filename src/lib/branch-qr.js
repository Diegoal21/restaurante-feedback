export const QR_TOKEN_PARAM = "qr";

export const branchQrTokens = {
  "gf-a9k4mp7xq2rl8vn5tc3zy6": "Gómez Farías",
  "nv-r8m2qk5zv7xp4tn9la6cd3": "Navarrete",
  "hc-p6x3va9lt2rq7mk4nz8yw5": "Hotel Colonial",
};

export function normalizeQrToken(token) {
  return String(token || "").trim().toLowerCase();
}

export function getBranchByQrToken(token) {
  return branchQrTokens[normalizeQrToken(token)] || "";
}

export function getQrLinks(baseUrl) {
  const cleanBaseUrl = String(baseUrl || "").replace(/\/$/, "");

  return Object.entries(branchQrTokens).map(([token, branch]) => ({
    branch,
    token,
    url: `${cleanBaseUrl}/?${QR_TOKEN_PARAM}=${token}`,
  }));
}
