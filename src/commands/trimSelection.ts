import { trimSelectedNodes } from "../utils";

export default async function () {
  await trimSelectedNodes();
  figma.closePlugin();
}
