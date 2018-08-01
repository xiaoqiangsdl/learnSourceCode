module.exports = class PromptModuleAPI {
  constructor (creator) {
    this.creator = creator
  }

  // 将 feature 选项填入
  injectFeature (feature) {
    this.creator.featurePrompt.choices.push(feature)
  }

  // 将 inject 选项填入
  injectPrompt (prompt) {
    this.creator.injectedPrompts.push(prompt)
  }

  injectOptionForPrompt (name, option) {
    this.creator.injectedPrompts.find(f => {
      return f.name === name
    }).choices.push(option)
  }

  onPromptComplete (cb) {
    this.creator.promptCompleteCbs.push(cb)
  }
}
