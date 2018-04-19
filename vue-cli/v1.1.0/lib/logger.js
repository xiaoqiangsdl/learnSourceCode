var chalk = require('chalk')
var format = require('util').format

/**
 * Prefix. 前缀
 */

var prefix = '   vue-cli'
var sep = chalk.gray('·')

/**
 * Log a `message` to the console.
 *
 * @param {String} message
 */
// 打印信息

exports.log = function () {
  // @! 用 apply 的目的就是让参数原样传入 format: log(a, b, c) => format(a, b, c)
  var msg = format.apply(format, arguments)
  console.log(chalk.white(prefix), sep, msg)
}

/**
 * Log an error `message` to the console and exit.
 *
 * @param {String} message
 */
// 打印错误信息并退出
// @- process.exit(0) 成功退出 process.exit(1) 异常退出

exports.fatal = function (message) {
  // 判断是否是错误类型，是的话取出错误信息
  if (message instanceof Error) message = message.message.trim()
  var msg = format.apply(format, arguments)
  console.error(chalk.red(prefix), sep, msg)
  process.exit(1)
}

/**
 * Log a success `message` to the console and exit.
 *
 * @param {String} message
 */
// 打印成功信息并退出

exports.success = function () {
  var msg = format.apply(format, arguments)
  console.log(chalk.white(prefix), sep, msg)
  process.exit(0)
}
