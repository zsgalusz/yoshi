import path from 'path';
import ejs from 'ejs';
import { TEMPLATES_BUILD_DIR } from 'yoshi-config/paths';

export default async (templateName: string, data: any = {}) => {
  const absolutePath = path.resolve(
    TEMPLATES_BUILD_DIR,
    process.env.NODE_ENV === 'development'
      ? `${templateName}.debug.ejs`
      : `${templateName}.prod.ejs`,
  );

  const html: string = await ejs.renderFile(absolutePath, data);

  return html;
};
