const fs = require('fs-extra');
const path = require('path');
const getFilesInDir = require('./getFilesInDir');
const replaceTemplates = require('./replaceTemplates');
const getValuesMap = require('./getValuesMap');
const loadTemplate = require('./loadTemplate');
const TemplateModel = require('./TemplateModel');

const generateProject = (templateModel, workingDir) => {
  const baseTemplatePath = templateModel.templateDefinition.extends;
  // if a templateDefintion has an extends property,
  // Generate the base template first and then override
  if (!!baseTemplatePath) {
    const baseTemplateDefinition = loadTemplate(baseTemplatePath);
    const baseTemplateModel = new TemplateModel({
      ...templateModel,
      templateDefinition: baseTemplateDefinition,
    });

    generateProject(baseTemplateModel, workingDir);
  }

  const valuesMap = getValuesMap(templateModel);

  const files = getFilesInDir(templateModel.getPath());

  for (const fileName in files) {
    const fullPath = path.join(workingDir, fileName);

    const transformed = replaceTemplates(files[fileName], valuesMap);
    const transformedPath = replaceTemplates(fullPath, valuesMap);

    fs.outputFileSync(transformedPath, transformed);
  }
};

module.exports = generateProject;
