import { pathToFileURL } from "node:url";

export function getSystemName(): string {
  return "web-coding-agent";
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(getSystemName());
}
