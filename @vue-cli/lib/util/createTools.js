// 创建项目时选项
// 对应 promptModules 的各个文件 - 文件里还包含子选项
exports.getPromptModules = () => {
  return [
    'babel',
    'typescript',
    'pwa',
    'router',
    'vuex',
    'cssPreprocessors',
    'linter',
    'unit',
    'e2e'
  ].map(file => require(`../promptModules/${file}`))
}
