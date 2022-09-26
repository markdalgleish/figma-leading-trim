import { trimSelectedNodes } from "../core";

export default async function () {
  await trimSelectedNodes();
  figma.closePlugin();
}
