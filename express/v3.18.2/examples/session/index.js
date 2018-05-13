
// first:
// $ npm install redis
// $ redis-server

var express = require('../..');

var app = express();

app.use(express.logger('dev'));

// Populates req.session
app.use(express.session({ secret: 'keyboard cat' }));

app.get('/', function(req, res){
  var body = '';
  if (req.session.views) {
    ++req.session.views;
  } else {
    req.session.views = 1;
    body += '<p>First time visiting? view this page in several browsers :)</p>';
  }
  res.send(body + '<p>viewed <strong>' + req.session.views + '</strong> times.</p>');
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
