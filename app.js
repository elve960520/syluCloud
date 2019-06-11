var express = require('express');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');

var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/', function (req, res) {
    //    res.send('Hello World');
    res.sendFile(__dirname + "/" + "index.html");
})

app.post('/checkStudentAccount', urlencodedParser, function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.mima);
        },
        function (xuehao, mima, callback) {
            // arg1 now equals 'one' and arg2 nowequals 'two'
            request.get({ url: "http://218.25.35.27:8080", encoding: null, forever: true }, function (err, response, body) {
                var loginUrl = response.request.uri.href;
                var sessurl = loginUrl.slice(0, 52);
                var buf = iconv.decode(body, 'gb2312');
                $ = cheerio.load(buf);
                var viresta = $('input').attr('value');
                //console.log($('input').attr('value'));
                var formData = {
                    '__VIEWSTATE': iconv.encode(viresta, 'gb2312'),
                    //'__VIEWSTATE':$('input').attr('value'),
                    'TextBox1': xuehao,
                    'TextBox2': mima,
                    'RadioButtonList1': iconv.encode("学生", 'gb2312'),
                    'Button1': '',
                    'lbLanguage': ''
                };
                //console.log(sessurl);
                //教学网登陆+++++++
                request.post({ url: loginUrl, encoding: null, form: formData, forever: true }, function (err, response, body) {
                    //console.log(iconv.decode(body, 'gb2312'));
                    $ = cheerio.load(iconv.decode(body, 'gb2312'));
                    var mainUrl = "http://218.25.35.27:8080" + $('a').attr('href');
                    //console.log(mainUrl);
                    //302跳转登陆
                    request.get({ url: mainUrl, encoding: null, forever: true }, function (err, response, body) {
                        //console.log(iconv.decode(body, 'gb2312'));
                        $ = cheerio.load(iconv.decode(body, 'gb2312'));
                        var re = /\s(\S{2,4})同学/;
                        var tempRe = /欢迎您/;
                        if (tempRe.test(iconv.decode(body, 'gb2312'))) {
                            var xingming = $('#xhxm').text().match(re)[1];
                            console.log(xingming);
                            name = xingming;
                            callback(null, xingming)
                            //return xingming
                        } else {
                            var xingming = null
                            console.log("err");
                            callback(null, xingming)
                            //return xingming
                        }
                    });
                    //console.log(err);    
                });
            });
        },
    ], function (err, result) {
        var response = {
            account:result!=null,
            name: result
        };
        res.end(JSON.stringify(response));   
    });
})

var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})
