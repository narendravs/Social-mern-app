const BuildImageUrl = (path, PF, version) => {
  if (!path) return null;
  if (path.startsWith("http"))
    return `${path}${version ? `?v=${version}` : ""}`;
  const normalized = path.replace(/^\/?images\//, "");
  return `${PF}${normalized}${version ? `?v=${version}` : ""}`;
};
export default BuildImageUrl;
