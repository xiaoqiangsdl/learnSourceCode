#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var program = require('commander');
var npm = require('npm');
var ini = require('ini');
var echo = require('node-echo');
var extend = require('extend');
var open = require('open');
var async = require('async');
var request = require('request');
var only = require('only');

var registries = require('./registries.json');
var PKG = require('./package.json');
var NRMRC = path.join(process.env.HOME, '.nrmrc');


program
    .version(PKG.version);

program
    .command('ls')
    .description('List all the registries')
    .action(onList);

program
    .command('current')
    .description('Show current registry name')
    .action(showCurrent);

program
    .command('use <registry>')
    .description('Change registry to registry')
    .action(onUse);

program
    .command('add <registry> <url> [home]')
    .description('Add one custom registry')
    .action(onAdd);

program
    .command('del <registry>')
    .description('Delete one custom registry')
    .action(onDel);

program
    .command('home <registry> [browser]')
    .description('Open the homepage of registry with optional browser')
    .action(onHome);

program
    .command('test [registry]')
    .description('Show response time for specific or all registries')
    .action(onTest);

program
    .command('help')
    .description('Print this help')
    .action(function () {
        program.outputHelp();
    });

program
    .parse(process.argv);


if (process.argv.length === 2) {
    program.outputHelp();
}

/*//////////////// cmd methods /////////////////*/
// 列出所有的源
function onList() {
    getCurrentRegistry(function(cur) {
        var info = [''];
        var allRegistries = getAllRegistry();

        // 获取源名
        Object.keys(allRegistries).forEach(function(key) {
            var item = allRegistries[key];
            var prefix = item.registry === cur ? '* ' : '  ';
            info.push(prefix + key + line(key, 8) + item.registry);
        });

        info.push('');
        printMsg(info);
    });
}

// 展示现在正在使用的源
function showCurrent() {
    getCurrentRegistry(function(cur) {
        var allRegistries = getAllRegistry();
        Object.keys(allRegistries).forEach(function(key) {
            var item = allRegistries[key];
            // 通过判断源是否匹配，得到对应的源的名称
            if (item.registry === cur) {
                printMsg([key]);
                return;
            }
        });
    });
}

// 切换源
function onUse(name) {
    var allRegistries = getAllRegistry();
    if (allRegistries.hasOwnProperty(name)) {
        var registry = allRegistries[name];
        npm.load(function (err) {
            if (err) return exit(err);
            // 使用 npm 包命令设置源
            npm.commands.config(['set', 'registry', registry.registry], function (err, data) {
                if (err) return exit(err);
                console.log('                        ');
                var newR = npm.config.get('registry');
                printMsg([
                    '', '   Registry has been set to: ' + newR, ''
                ]);
            })
        });
    } else {
        printMsg([
            '', '   Not find registry: ' + name, ''
        ]);
    }
}

// 删除源
// 只能删除自定义源
function onDel(name) {
    var customRegistries = getCustomRegistry();
    if (!customRegistries.hasOwnProperty(name)) return;
    getCurrentRegistry(function(cur) {
        // 如果要删除的源是正在使用的源，那就切换回 npm
        if (cur === customRegistries[name].registry) {
            onUse('npm');
        }
        // 删除该属性
        delete customRegistries[name];
        // 重新设置本地源
        setCustomRegistry(customRegistries, function(err) {
            if (err) return exit(err);
            printMsg([
                '', '    delete registry ' + name + ' success', ''
            ]);
        });
    });
}

// 添加一个新的源
function onAdd(name, url, home) {
    var customRegistries = getCustomRegistry();
    // 如果已经有这个名称了，不再执行下面的代码
    // @~ 个人觉得不太合理，只检查自定义源，万一和那些官方源重复了呢？应该用 getAllRegistry
    if (customRegistries.hasOwnProperty(name)) return;
    var config = customRegistries[name] = {};
    if (url[url.length - 1] !== '/') url += '/'; // ensure url end with /
    config.registry = url;
    if (home) {
        config.home = home;
    }
    setCustomRegistry(customRegistries, function(err) {
        if (err) return exit(err);
        printMsg([
            '', '    add registry ' + name + ' success', ''
        ]);
    });
}

// 用浏览器打开官方网页
function onHome(name, browser) {
    var allRegistries = getAllRegistry();
    var home = allRegistries[name] && allRegistries[name].home;
    if (home) {
        var args = [home];
        if (browser) args.push(browser);
        // 使用 open 打开地址
        open.apply(null, args);
    }
}

// 测试源的网速
function onTest(registry) {
    var allRegistries = getAllRegistry();

    var toTest;

    // 如果有指定源，那就显示单个
    // 如果没有指定源，就显示全部的响应时间
    if (registry) {
        if (!allRegistries.hasOwnProperty(registry)) {
            return;
        }
        toTest = only(allRegistries, registry);
    } else {
        toTest = allRegistries;
    }

    // @! async 要学会用
    async.map(Object.keys(toTest), function(name, cbk) {
        var registry = toTest[name];
        var start = +new Date();
        request(registry.registry + 'pedding', function(error) {
            cbk(null, {
                name: name,
                registry: registry.registry,
                time: (+new Date() - start),  // 通过响应返回时间点减去请求发起时间点，得到响应时间
                error: error ? true : false
            });
        });
    }, function(err, results) {
        getCurrentRegistry(function(cur) {
            var msg = [''];
            // 获取每个源响应时间
            results.forEach(function(result) {
                // 当前源 加上 * 号
                // 通过 result.time 来拿到请求和响应的时间差
                var suffix = result.error ? 'Fetch Error' : result.time + 'ms';
                msg.push(prefix + result.name + line(result.name, 8) + suffix);
            });
            msg.push('');
            printMsg(msg);
        });
    });
}



/*//////////////// helper methods /////////////////*/

/*
 * get current registry
 * 获取现在使用的源
 */
function getCurrentRegistry(cbk) {
    npm.load(function(err, conf) {
        if (err) return exit(err);
        cbk(npm.config.get('registry'));
    });
}

// 获取本地自定义源的信息
function getCustomRegistry() {
    return fs.existsSync(NRMRC) ? ini.parse(fs.readFileSync(NRMRC, 'utf-8')) : {};
}

// 设置自定义数据，存在本地文件内
function setCustomRegistry(config, cbk) {
    echo(ini.stringify(config), '>', NRMRC, cbk);
}

// 获取所有数据信息
// 官方数据 +  自定义数据
function getAllRegistry() {
    return extend({}, registries, getCustomRegistry());
}

// 打印报错
function printErr(err) {
    console.error('an error occured: ' + err);
}

// 打印信息
// 传入的是数组
function printMsg(infos) {
    infos.forEach(function(info) {
        console.log(info);
    });
}

/*
 * print message & exit
 * 打印信息并退出
 */
function exit(err) {
    printErr(err);
    process.exit(1);
}

// 根据名称长度补全线条
function line(str, len) {
    // 1 到时候是没有线 最多是 len - 1 条线
    // @~ 我觉得还是 len - str.length + 1 看起来比较直观一些
    var line = new Array(Math.max(1, len - str.length)).join('-');
    return ' ' + line + ' ';
}
