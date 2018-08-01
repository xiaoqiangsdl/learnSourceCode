// commandName 命令名 只是在出现报错是提示用的
// moduleName 模块名 对应 npm 模块
module.exports = function loadCommand (commandName, moduleName) {
  // 判断是否有无模块
  const isNotFoundError = err => {
    return err.message.match(/Cannot find module/)
  }
  try {
    // 返回对应模块
    return require(moduleName)
  } catch (err) {
    if (isNotFoundError(err)) {
      try {
        return require('import-global')(moduleName)
      } catch (err2) {
        if (isNotFoundError(err2)) {
          const chalk = require('chalk')
          const { hasYarn } = require('@vue/cli-shared-utils')
          const installCommand = hasYarn() ? `yarn global add` : `npm install -g`
          console.log()
          console.log(
            `  Command ${chalk.cyan(`vue ${commandName}`)} requires a global addon to be installed.\n` +
            `  Please run ${chalk.cyan(`${installCommand} ${moduleName}`)} and try again.`
          )
          console.log()
          process.exit(1)
        } else {
          throw err2
        }
      }
    } else {
      throw err
    }
  }
}
