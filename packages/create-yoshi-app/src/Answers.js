const path = require('path');

module.exports = class Answers {
  constructor({
    projectName,
    templateDefinition,
    authorName,
    authorEmail,
    organization,
    transpiler,
  }) {
    this.templateDefinition = templateDefinition;
    this.projectName = projectName;
    this.authorName = authorName;
    this.authorEmail = authorEmail;
    this.organization = organization;
    this.transpiler = transpiler;
    this.lang = this.transpiler === 'typescript' ? 'typescript' : 'javascript';
  }

  get templatePath() {
    return path.join(this.templateDefinition.path, this.lang);
  }

  get templateTitle() {
    return `${this.templateDefinition.name}-${this.lang}`;
  }

  toJSON() {
    return {
      projectType: this.projectType,
      projectName: this.projectName,
      authorName: this.authorName,
      authorEmail: this.authorEmail,
      organization: this.organization,
      transpiler: this.transpiler,
      templatePath: this.templatePath,
    };
  }

  static fromJSON({ templatePath, ...opts }) {
    const answers = new Answers(opts);
    Object.defineProperty(answers, 'templatePath', {
      get: function() {
        return templatePath;
      },
    });
    return answers;
  }
};
