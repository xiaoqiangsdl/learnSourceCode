// Underscore.js
// (c) 2009 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the terms of the MIT license.
// Portions of Underscore are inspired by or borrowed from Prototype.js, 
// Oliver Steele's Functional, And John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore/
window._ = {
  
  VERSION : '0.1.0',
  
  /*------------------------ Collection Functions: ---------------------------*/
    
  // 遍历 数组
  // Array.forEach
  each : function(obj, iterator, context) {
    var index = 0;
    try {
      if (obj.forEach) {
        obj.forEach(iterator, context);
      } else if (obj.length) {
        for (var i=0; i<obj.length; i++) iterator.call(context, obj[i], i);
      } else if (obj.each) {
        obj.each(function(value) { iterator.call(context, value, index++); });
      } else {
        // 针对对象类型
        // TODO 熟悉下这顿代码
        var i = 0;
        for (var key in obj) {
          var value = obj[key], pair = [key, value];
          pair.key = key;
          pair.value = value;
          iterator.call(context, pair, i++);
        }
      }
    } catch(e) {
      // 检测到跑出的报错 '__break__'，停止循环
      // 非 '__break__' 抛出异信息
      if (e != '__break__') throw e;
    }
    return obj;
  },
  
  // 数组元素 映射
  // Array.map
  map : function(obj, iterator, context) {
    if (obj && obj.map) return obj.map(iterator, context);
    var results = [];
    _.each(obj, function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  },
  
  // 累加
  inject : function(obj, memo, iterator, context) {
    _.each(obj, function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  },
  
  // 返回第一个匹配到的值
  detect : function(obj, iterator, context) {
    var result;
    _.each(obj, function(value, index) {
      // 如果匹配到了返回数据，结束循环
      if (iterator.call(context, value, index)) {
        result = value;
        throw '__break__';
      }
    });
    return result;
  },
  
  // 过滤数据，留下符合条件的数据
  select : function(obj, iterator, context) {
    if (obj.filter) return obj.filter(iterator, context);
    var results = [];
    _.each(obj, function(value, index) {
      if (iterator.call(context, value, index)) results.push(value);
    });
    return results;
  },
  
  // 过滤数据，留下不符合条件的数据。与 select 相反
  reject : function(obj, iterator, context) {
    var results = [];
    _.each(obj, function(value, index) {
      if (!iterator.call(context, value, index)) results.push(value);
    });
    return results;
  },
  
  // 检验每个元素是否都符合指定条件
  // Array.every
  all : function(obj, iterator, context) {
    iterator = iterator || function(v){ return v; };
    if (obj.every) return obj.every(iterator, context);
    var result = true;
    _.each(obj, function(value, index) {
      // 两个等号确保变成 bol
      result = result && !!iterator.call(context, value, index);
      if (!result) throw '__break__';
    });
    return result;
  },
  
  // 检测数组中是有元素否满足指定条件
  // Array.some
  any : function(obj, iterator, context) {
    iterator = iterator || function(v) { return v; };
    if (obj.some) return obj.some(iterator, context);
    var result = false;
    _.each(obj, function(value, index) {
      if (result = !!iterator.call(context, value, index)) throw '__break__';
    });
    return result;
  },
  
  // 判断元素是否在数组中
  include : function(obj, target) {
    if (_.isArray(obj)) return _.indexOf(obj, target) != -1;
    var found = false;
    _.each(obj, function(pair) {
      if (pair.value === target) {
        found = true;
        throw '__break__';
      }
    });
    return found;
  },
  
  // 每个元素执行方法，返回处理后的值
  invoke : function(obj, method) {
    var args = _.toArray(arguments).slice(2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  },
  
  // 简化般的 map。每个元素某个属性值
  pluck : function(obj, key) {
    var results = [];
    _.each(obj, function(value){ results.push(value[key]); });
    return results;
  },
  
  // 返回最大值
  max : function(obj, iterator, context) {
    // apply 第二个元素传入的是 arg
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result;
    _.each(obj, function(value, index) {
      var computed = iterator ? iterator.call(context, value, index) : value;
      if (result == null || computed >= result.computed) result = {value : value, computed : computed};
    });
    return result.value;
  },
  
  // 返回最小值
  min : function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result;
    _.each(obj, function(value, index) {
      var computed = iterator ? iterator.call(context, value, index) : value;
      if (result == null || computed < result.computed) result = {value : value, computed : computed};
    });
    return result.value;
  },
  
  // 排序
  // 1. map 数组生成 [{value: xxx, criteria: xxx},{...},...] 格式的数据 （值 - 转换值） 
  // 2. 对 map 后的数据以 criteria 属性排序
  // 3. 排序完提取每个对象中的 value 属性值
  sortBy : function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index) {
      return {
        value : value,
        criteria : iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  },
  
  // 查找顺序数组中插入的最佳位置
  sortedIndex : function(array, obj, iterator) {
    iterator = iterator || function(val) { return val; };
    var low = 0, high = array.length;
    // 二分查找法  
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  },
  
  // 类数组转换成数组
  toArray : function(iterable) {
    if (!iterable) return [];
    if (_.isArray(iterable)) return iterable;
    return _.map(iterable, function(val){ return val; });
  },
  
  // 返回数组的长度 length
  size : function(obj) {
    return _.toArray(obj).length;
  },
  
  /*-------------------------- Array Functions: ------------------------------*/
  
  // 获取第一个元素
  first : function(array) {
    return array[0];
  },
  
  // 获取最后一个元素
  last : function(array) {
    return array[array.length - 1];
  },
  
  // 筛选出所有存在的数据
  compact : function(array) {
    return _.select(array, function(value){ return !!value; });
  },
  
  // 扁平化数组
  flatten : function(array) {
    return _.inject(array, [], function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo.push(value);
      return memo;
    });
  },
  
  // 数组去掉对应值
  without : function(array) {
    // 【纠错】这里的 index 应为 1，否者会包含 array 参数
    var values = array.slice.call(arguments, 0);
    return _.select(array, function(value){ return !_.include(values, value); });
  },
  
  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  uniq : function(array, isSorted) {
    return _.inject(array, [], function(memo, el, i) {
      if (0 == i || (isSorted ? _.last(memo) != el : !_.include(memo, el))) memo.push(el);
      return memo;
    });
  },
  
  // Produce an array that contains every item shared between all the 
  // passed-in arrays.
  intersect : function(array) {
    var rest = _.toArray(arguments).slice(1);
    return _.select(_.uniq(array), function(item) {
      return _.all(rest, function(other) { 
        return _.indexOf(other, item) >= 0;
      });
    });
  },
  
  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  zip : function() {
    var args = _.toArray(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i=0; i<length; i++) results[i] = _.pluck(args, String(i));
    return results;
  },
  
  // 数组中第一个匹配项的索引值
  // Array.indexOf
  indexOf : function(array, item) {
    if (array.indexOf) return array.indexOf(item);
    var length = array.length;
    for (i=0; i<length; i++) if (array[i] === item) return i;
    return -1;
  },
  
  /* ----------------------- Function Functions: -----------------------------*/
  
  // Create a function bound to a given object (assigning 'this', and arguments,
  // optionally). Binding with arguments is also known as 'curry'.
  bind : function(func, context) {
    if (!context) return func;
    var args = _.toArray(arguments).slice(2);
    return function() {
      var a = args.concat(_.toArray(arguments));
      return func.apply(context, a);
    };
  },
  
  // Bind all of an object's methods to that object. Useful for ensuring that 
  // all callbacks defined on an object belong to it.
  bindAll : function() {
    var args = _.toArray(arguments);
    var context = args.pop();
    _.each(args, function(methodName) {
      context[methodName] = _.bind(context[methodName], context);
    });
  },
  
  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  delay : function(func, wait) {
    var args = _.toArray(arguments).slice(2);
    return window.setTimeout(function(){ return func.apply(func, args); }, wait);
  },
  
  // Defers a function, scheduling it to run after the current call stack has 
  // cleared.
  defer : function(func) {
    return _.delay.apply(_, [func, 1].concat(_.toArray(arguments).slice(1)));
  },
  
  // Returns the first function passed as an argument to the second, 
  // allowing you to adjust arguments, run code before and after, and 
  // conditionally execute the original function.
  wrap : function(func, wrapper) {
    return function() {
      var args = [func].concat(_.toArray(arguments));
      return wrapper.apply(wrapper, args);
    };
  },
  
  /* ------------------------- Object Functions: ---------------------------- */
  
  // 返回对象的 key
  keys : function(obj) {
    return _.pluck(obj, 'key');
  },
  
  // 返回对象的 value
  values : function(obj) {
    return _.pluck(obj, 'value');
  },
  
  // 继承
  // ？？ 遍历队形的属性 给 另一个对象
  extend : function(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  },
  
  // 克隆对象
  clone : function(obj) {
    return _.extend({}, obj);
  },
  
  // 判断两个对象是否相等
  isEqual : function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // 递归遍历子元素
    for (var key in a) if (!_.isEqual(a[key], b[key])) return false;
    return true;
  },
  
  // 判断是否是 dom 元素
  isElement : function(obj) {
    // 判断 nodeType 属性是否是 1 -> dom
    return !!(obj && obj.nodeType == 1);
  },
  
  // 判断是否是数组
  isArray : function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  },
  
  // 判断是否是 function
  isFunction : function(obj) {
    return typeof obj == 'function';
  },
  
  // 判断是否是 undefined
  isUndefined : function(obj) {
    return typeof obj == 'undefined';
  },
  
  /* -------------------------- Utility Functions: -------------------------- */
  
  // 生成唯一 ID，可拼接
  uniqueId : function(prefix) {
    var id = this._idCounter = (this._idCounter || 0) + 1;
    return prefix ? prefix + id : id;
  },
  
  // 模板引擎生成 - 来自 js 忍者秘籍
  // ！！加强学习下
  template : function(str, data) {
    var fn = new Function('obj', 
      'var p=[],print=function(){p.push.apply(p,arguments);};' +
      'with(obj){p.push(\'' +
      str
        .replace(/[\r\t\n]/g, " ") 
        .split("<%").join("\t") 
        .replace(/((^|%>)[^\t]*)'/g, "$1\r") 
        .replace(/\t=(.*?)%>/g, "',$1,'") 
        .split("\t").join("');") 
        .split("%>").join("p.push('") 
        .split("\r").join("\\'") 
    + "');}return p.join('');");
    return data ? fn(data) : fn;  
  }
  
};
