#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const slash = require('slash')  // 转换路径中的双反斜杠转换成斜杠
const chalk = require('chalk')
const semver = require('semver')
const minimist = require('minimist')
const requiredVersion = require('../package.json').engines.node

// 分析 node 版本是否符合要求
if (!semver.satisfies(process.version, requiredVersion)) {
  console.log(chalk.red(
    `You are using Node ${process.version}, but this version of vue-cli ` +
    `requires Node ${requiredVersion}.\nPlease upgrade your Node version.`
  ))
  process.exit(1)
}

// enter debug mode when creating test repo
// 当创建测试仓库时进入 debug 模式
if (
  // 判断有无目录
  slash(process.cwd()).indexOf('/packages/test') > 0 && (
    fs.existsSync(path.resolve(process.cwd(), '../@vue')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@vue'))
  )
) {
  process.env.VUE_CLI_DEBUG = true
}

const program = require('commander')
const loadCommand = require('../lib/util/loadCommand')

program
  .version(require('../package').version)
  .usage('<command> [options]')

// 创建项目
program
  .command('create <app-name>')
  .description('create a new project powered by vue-cli-service')
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
  .option('-d, --default', 'Skip prompts and use default preset')
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-g, --git [message]', 'Force / skip git intialization, optionally specify initial commit message')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .option('-c, --clone', 'Use git clone when fetching remote preset')
  .option('-x, --proxy', 'Use specified proxy when creating project')
  .action((name, cmd) => {
    console.log(cleanArgs(cmd));
    console.log(cmd.options);
    require('../lib/create')(name, cleanArgs(cmd))
  })

// 添加插件
program
  .command('add <plugin> [pluginOptions]')
  .allowUnknownOption()
  .description('install a plugin and invoke its generator in an already created project')
  .action((plugin) => {
    require('../lib/add')(plugin, minimist(process.argv.slice(3)))
  })

// 调用插件
program
  .command('invoke <plugin> [pluginOptions]')
  .allowUnknownOption()
  .description('invoke the generator of a plugin in an already created project')
  .action((plugin) => {
    require('../lib/invoke')(plugin, minimist(process.argv.slice(3)))
  })

// 检查项目的 webpack 配置
program
  .command('inspect [paths...]')
  .option('--mode <mode>')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .option('-v --verbose', 'Show full function definitions in output')
  .description('inspect the webpack config in a project with vue-cli-service')
  .action((paths, cmd) => {
    require('../lib/inspect')(paths, cleanArgs(cmd))
  })

// 启动服务
program
  .command('serve [entry]')
  .description('serve a .js or .vue file in development mode with zero config')
  .option('-o, --open', 'Open browser')
  .option('-c, --copy', 'Copy local url to clipboard')
  .action((entry, cmd) => {
    loadCommand('serve', '@vue/cli-service-global').serve(entry, cleanArgs(cmd))
  })

// 打包项目
program
  .command('build [entry]')
  .option('-t, --target <target>', 'Build target (app | lib | wc | wc-async, default: app)')
  .option('-n, --name <name>', 'name for lib or web-component mode (default: entry filename)')
  .option('-d, --dest <dir>', 'output directory (default: dist)')
  .description('build a .js or .vue file in production mode with zero config')
  .action((entry, cmd) => {
    loadCommand('build', '@vue/cli-service-global').build(entry, cleanArgs(cmd))
  })

// 在网页中打开配置
program
  .command('ui')
  .option('-p, --port <port>', 'Port used for the UI server (by default search for awailable port)')
  .option('-D, --dev', 'Run in dev mode')
  .option('--quiet', `Don't output starting messages`)
  .option('--headless', `Don't open browser on start and output port`)
  .description('start and open the vue-cli ui')
  .action((cmd) => {
    require('../lib/ui')(cleanArgs(cmd))
  })

// 创建项目 老的方式 2.x 版本
program
  .command('init <template> <app-name>')
  .description('generate a project from a remote template (legacy API, requires @vue/cli-init)')
  .option('-c, --clone', 'Use git clone when fetching remote template')
  .action(() => {
    loadCommand('init', '@vue/cli-init')
  })

// output help information on unknown commands
// 当输入不存在的命令时。输出 help 信息
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
  })

// add some useful info on help
// 提示帮助信息时加入一些有用的信息
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
// 补充常见错误信息
const enhanceErrorMessages = (methodName, log) => {
  program.Command.prototype[methodName] = function (...args) {
    if (methodName === 'unknownOption' && this._allowUnknownOption) {
      return
    }
    this.outputHelp()
    console.log(`  ` + chalk.red(log(...args)))
    console.log()
    process.exit(1)
  }
}

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

// 若没有输入子命令，跳报错
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
// 将 option 转换成对象
// 使用的选项 对应的 value 为 true, 否则为 undefined
function cleanArgs (cmd) {
  const args = {}
  cmd.options.forEach(o => {
    const key = o.long.replace(/^--/, '')
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function') {
      args[key] = cmd[key]
    }
  })
  return args
}
