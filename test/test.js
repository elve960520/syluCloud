var express = require('express');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var sourceList = new Array();
var xuehao = "1403060425";
var mima = "123456";
function strToUrlgb2312(str) {
    var data = iconv.encode(str, 'gb2312').toString('hex')
    var tempArr = []
    for (var i = 1; i <= data.length / 2; i++) {
        var j = i * 2 - 2;
        tempArr[i - 1] = data.substr(j, 2);
    }
    var finaStr = tempArr.join("%");
    finaStr = "%" + finaStr;
    return finaStr;
    // body...
}
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
    // console.log(sessurl);
    //console.log(iconv.encode("学生",'gb2312'));
    //教学网登陆+++++++
    request.post({ url: loginUrl, encoding: null, form: formData, forever: true }, function (err, response, body) {
        //console.log(iconv.decode(body, 'gb2312'));
        //console.log(response.request);
        $ = cheerio.load(iconv.decode(body, 'gb2312'));
        var mainUrl = "http://218.25.35.27:8080" + $('a').attr('href');
        console.log(mainUrl);
        //302跳转登陆
        request.get({ url: mainUrl, encoding: null, forever: true }, function (err, response, body) {
            //console.log(iconv.decode(body, 'gb2312'));
            $ = cheerio.load(iconv.decode(body, 'gb2312'));
            var re = /\s(\S{2,4})同学/;
            var xingming = $('#xhxm').text().match(re)[1];
            console.log(xingming);
            var header = {
                'Referer': mainUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36'
            };
            var tempUrl = sessurl + "xskbcx.aspx?xh=" + xuehao + "&xm=" + strToUrlgb2312(xingming) + "&gnmkdm=N121501";
            request.get({ url: tempUrl, encoding: null, forever: true, headers: header }, function (err, response, body) {
                console.log(tempUrl);
                body = iconv.decode(body, 'gb2312');
                re = /(<br|rowspan=\"2\"|width=\"7%\")>[^<](\S+?)<br>周(一|二|三|四|五|六|日)第(1|3|5|7|9|11),(2|4|6|8|10|12)节{第(\d+)-(\d+)周\S{0,3}}<br>(\S+?)<br>(\S+?)<(br>|\/td>)/g;
                //re = /<td align="Center" rowspan="2"\s{0,1}\S{0,10}>(\S+)<br>(周\S+)<br>(\S+)<br>([A-Z]{0,4}-\d+)<\/td>/g;
                var course = body.match(re);
                var source_id = 0;
                if (course) {
                    for (let index = 0; index < course.length; index++) {
                        var element = course[index];
                        // console.log(element);
                        tempRe = />(\S+?)<br>周(一|二|三|四|五|六|日)第(1|3|5|7|9|11),\d{1,2}节{第(\d+)-(\d+)周\S{0,3}}<br>(\S+?)<br>(\S+?)</;
                        var sourceArray = element.match(tempRe);
                        sourceList[source_id] = {
                            sourceId: source_id++,
                            sourceName: sourceArray[1],
                            sourceClassRoom: sourceArray[7],
                            sourceStartWeek: sourceArray[4],
                            sourceEndWeek: sourceArray[5],
                            sourceWeekDay: (sourceArray[2]),
                            sourceTime: sourceArray[3],
                            sourceTeacher: sourceArray[6],
                            sourceSingleWeek: element.match("单")?1:(element.match("双")?2:0)
                        };
                        var nowDate = new Date();
                        var nowYear = nowDate.getFullYear();
                        var nowMonth = nowDate.getMonth();
                        if (nowMonth < 3) {
                            var xuenian = nowYear - 1 + "-" + nowYear;
                            var xueqi = "1";
                        } else if (nowMonth < 9) {
                            var xuenian = nowYear - 1 + "-" + nowYear;
                            var xueqi = "2";
                        } else {
                            var xuenian = nowYear + "-" + nowYear + 1;
                            var xueqi = "1";
                        }
                        // saveStudentSource(xuehao, xuenian, xueqi, sourceList);
                    }
                } else {
                    sourceList[0] = {
                        sourceId: 0,
                        sourceName: null,
                        sourceClassRoom: null,
                        sourceStartWeek: null,
                        sourceEndWeek: null,
                        sourceWeekDay: null,
                        sourceTime: null,
                        sourceTeacher: null,
                        sourceSingleWeek: 0
                    };
                }
                for (let index = 0; index < sourceList.length; index++) {
                    const element = sourceList[index];
                    console.log(element)
                    console.log(element.sourceSingleWeek)
                }
            })
        })
    })
})
