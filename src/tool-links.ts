import { catalog, type Locale } from './tool-registry';

export const toolHref = (id: string, lang: Locale): string => {
  const tool = catalog.find(candidate => candidate.id === id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return tool.path[lang];
};
