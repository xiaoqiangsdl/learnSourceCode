var request = require('request')
var semver = require('semver')
var chalk = require('chalk')

module.exports = function (done) {
  // @! 通过 https://registry.npmjs.org/:npm 来获取 npm 的详细信息
  // 用于判断脚手架是否是最新的
  request({
    url: 'https://registry.npmjs.org/vue-cli',
    timeout: 1000
  }, function (err, res, body) {
    if (!err && res.statusCode === 200) {
      // 最新版本信息在 data['dist-tags'].latset 下 
      var latestVersion = JSON.parse(body)['dist-tags'].latest
      var localVersion = require('../package.json').version
      if (semver.lt(localVersion, latestVersion)) {
        console.log(chalk.yellow('  A newer version of vue-cli is available.'))
        console.log()
        console.log('  latest:    ' + chalk.green(latestVersion))
        console.log('  installed: ' + chalk.red(localVersion))
        console.log()
      }
    }
    done()
  })
}
