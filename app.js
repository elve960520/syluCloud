var express = require('express');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

var url = "mongodb://root:meng9826873201@localhost:27017";
var app = express();
app.use(bodyParser.json())
// var urlencodedParser = bodyParser.urlencoded({ extended: false })

//保存学号密码姓名到数据库
function saveStudentBasicInfo(xuehao, mima, xingming) {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        //console.log("数据库已连接!");
        var dbSylu = db.db("syluCloud");
        //修改数据
        var findData = { xuehao: xuehao };
        var insertData = {
            xuehao: xuehao,
            mima: mima,
            xingming: xingming
        };
        var upData = {
            $set: {
                mima: mima,
                xingming: xingming
            }
        };
        dbSylu.collection("studentBasicInfo").find(findData).toArray(function (err, result) { // 返回集合中所有数据
            if (err) throw err;
            if (result.length == 0) {
                dbSylu.collection("studentBasicInfo").insertOne(insertData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档插入成功");
                    db.close();
                });
            } else {
                dbSylu.collection("studentBasicInfo").updateOne(findData, upData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档更新成功");
                    db.close();
                });
            }
        });
    });
}
//保存课表到数据库
function saveStudentSource(xuehao, xuenian, xueqi, source) {
    // var url = "mongodb://root:meng9826873201@localhost:27017";
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        //console.log("数据库已连接!");
        var dbSylu = db.db("syluCloud");
        //修改数据
        var findData = { xuehao: xuehao, xuenian: xuenian, xueqi: xueqi };
        var insertData = {
            xuehao: xuehao,
            xuenian: xuenian,
            xueqi: xueqi,
            source: source
        };
        var upData = {
            $set: {
                source: source
            }
        };
        dbSylu.collection("studentSource").find(findData).toArray(function (err, result) { // 返回集合中所有数据
            if (err) throw err;
            if (result.length == 0) {
                dbSylu.collection("studentSource").insertOne(insertData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档插入成功");
                    db.close();
                });
            } else {
                dbSylu.collection("studentSource").updateOne(findData, upData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档更新成功");
                    db.close();
                });
            }
        });
    });
}
//保持成绩到数据库
function saveStudentMark(xuehao, mark) {
    // var url = "mongodb://root:meng9826873201@localhost:27017";
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        //console.log("数据库已连接!");
        var dbSylu = db.db("syluCloud");
        //修改数据
        var findData = { xuehao: xuehao };
        var insertData = {
            xuehao: xuehao,
            mark: mark
        };
        var upData = {
            $set: {
                mark: mark
            }
        };
        dbSylu.collection("studentMark").find(findData).toArray(function (err, result) { // 返回集合中所有数据
            if (err) throw err;
            if (result.length == 0) {
                dbSylu.collection("studentMark").insertOne(insertData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档插入成功");
                    db.close();
                });
            } else {
                dbSylu.collection("studentMark").updateOne(findData, upData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档更新成功");
                    db.close();
                });
            }
        });
    });
}
//将字符串转成 url 的 gb2312 编码
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
//将中国字转成数字
function weekCHineseToNumber(str) {
    if (str == "一") {
        return 1;
    } else if (str == "二") {
        return 2;
    } else if (str == "三") {
        return 3;
    } else if (str == "四") {
        return 4;
    } else if (str == "五") {
        return 5;
    } else if (str == "六") {
        return 6;
    } else if (str == "日") {
        return 7;
    }
}
//提取学位并存入 返回list
function insertXuewei(list, body, callback) {
    var templist = list;
    xueweiListRe = /<td>.*?\d{9}.*?<\/td>.*?查看介绍<\/a>.*?是\S{0,8}<\/td>\s+<\/tr>/g;
    var markListReList = body.match(xueweiListRe);
    //console.log(markListReList);
    if (markListReList) {
        for (let index = 0; index < markListReList.length; index++) {
            const element = markListReList[index];
            var xueweiRe = /(\d{9})/g;
            var xueweiList = element.match(xueweiRe);
            // for (let indexI = 0; indexI < xueweiList.length; indexI++) {
            //     const elem = xueweiList[indexI];
            templist.push(xueweiList[1]);
            // }
        }
    }
    callback(templist);
};
//获取学位课数组
function getXuewei(xuehao, mima, callback) {
    async.waterfall([
        function (callback) {
            callback(null, xuehao, mima);
        }, function (xuehao, mima, callback) {
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
                callback(null, loginUrl, formData, sessurl);
            });
        }, function (loginUrl, formData, sessurl, callback) {
            request.post({ url: loginUrl, encoding: null, form: formData, forever: true }, function (err, response, body) {
                //console.log(iconv.decode(body, 'gb2312'));
                //console.log(response.request);
                $ = cheerio.load(iconv.decode(body, 'gb2312'));
                var mainUrl = "http://218.25.35.27:8080" + $('a').attr('href');
                console.log(mainUrl);
                //302跳转登陆
                callback(null, mainUrl, sessurl)
            });
        }, function (mainUrl, sessurl, callback) {
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
                var tempUrl = sessurl + "pyjh.aspx?xh=" + xuehao + "&xm=" + strToUrlgb2312(xingming) + "&gnmkdm=N121607";
                callback(null, tempUrl, header)

            });
        }, function (tempUrl, header, callback) {
            request.get({ url: tempUrl, encoding: null, forever: true, headers: header }, function (err, response, body) {
                //console.log(iconv.decode(body, 'gb2312'));
                $ = cheerio.load(iconv.decode(body, 'gb2312'));
                var viewstate = $('input').attr('name', '__VIEWSTATE')[2].attribs.value;
                //console.log(viewstate)
                header = {
                    'Referer': tempUrl,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36'
                };
                var xueweiList = [];
                callback(null, tempUrl, header, viewstate, xueweiList)

            });
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '1',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });
            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '2',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });

            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '3',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });

            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '4',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });

            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '5',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });

            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '6',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });

            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '7',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, tempUrl, header, viewstate, xueweiList)
                });
            })
        }, function (tempUrl, header, viewstate, xueweiList, callback) {
            formData = {
                '__EVENTTARGET': 'xq',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                //'__VIEWSTATE':$('input').attr('value'),
                'xq': '8',
                'kcxz': iconv.encode('全部', 'gb2312')
            };
            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                body = iconv.decode(body, 'gb2312');
                insertXuewei(xueweiList, body, function (xueweiList) {
                    console.log(xueweiList);
                    callback(null, xueweiList);
                });
                
            })
        }

    ], function (err, result) {
        //console.log(result);
        callback(result);
    });
}
//测试界面（本地实验）
app.get('/', function (req, res) {
    //    res.send('Hello World');
    res.sendFile(__dirname + "/" + "index.html");
})
//获取赞赏二维码
app.get('/zan', function (req, res) {
    res.sendFile(__dirname + "/" + "zan.jpg");
})
app.post('/sendOpinion', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.classify, req.body.text, req.body.phone);
        },
        function (xuehao, classify, text, phone, callback) {
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                //console.log("数据库已连接!");
                var dbSylu = db.db("syluCloud");
                //修改数据
                var insertData = {
                    xuehao: xuehao,
                    classify: classify,
                    text: text,
                    phone: phone
                };
                dbSylu.collection("Opinons").insertOne(insertData, function (err, res) {
                    if (err) throw err;
                    //console.log("文档插入成功");
                    db.close();
                    callback(null, "ok");
                })
            });
        }
    ], function (err, result) {
        res.end(result);
    });
});
//获取周
app.post('/getWeekNumber', function (req, res) {
    async.waterfall([
        function (callback) {
            var date1 = new Date();
            var date2 = new Date('2019-03-04');
            var date = (date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000);
            //alert(parseInt(date)/7+1);
            callback(null, (parseInt(date) / 7 + 1) > 20 ? 20 : (parseInt(date) / 7 + 1));
        },
        function (weekNum, callback) {
            let weekData = {
                weekNum: weekNum
            };
            callback(null, weekData);
            console.log(weekData)
        }
    ], function (err, result) {
        res.end(JSON.stringify(result));
    });
});
//获取view和star
app.post('/getViewAndStar', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao);
        },
        function (xuehao, callback) {
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                //console.log("数据库已连接!");
                var dbSylu = db.db("syluCloud");
                let starNum = 0;
                dbSylu.collection("viewAndStar").find({}).toArray(function (err, result) {
                    console.log(result)
                    for (let index = 0; index < result.length; index++) {
                        const element = result[index];
                        if (element.xuehao == xuehao) {
                            var stared = element.star;
                        }
                        if (element.star == true) {
                            starNum = starNum + 1;
                        }
                    }
                    var resuData = {
                        viewNum: result.length,
                        starNum: starNum,
                        stared: stared
                    }
                    callback(null, resuData);
                    db.close();
                    console.log(resuData);
                });
            });
        }
    ], function (err, result) {
        res.end(JSON.stringify(result));
    });
});
//设置view
app.post('/setViewNum', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao);
        },
        function (xuehao, callback) {
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                //console.log("数据库已连接!");
                var dbSylu = db.db("syluCloud");
                //修改数据
                var findData = { xuehao: xuehao };
                var insertData = {
                    xuehao: xuehao,
                    view: true
                };
                var upData = {
                    $set: {
                        view: true
                    }
                };
                dbSylu.collection("viewAndStar").find(findData).toArray(function (err, result) { // 返回集合中所有数据
                    if (err) throw err;
                    if (result.length == 0) {
                        dbSylu.collection("viewAndStar").insertOne(insertData, function (err, res) {
                            if (err) throw err;
                            //console.log("文档插入成功");
                            db.close();
                        });
                    } else {
                        dbSylu.collection("viewAndStar").updateOne(findData, upData, function (err, res) {
                            if (err) throw err;
                            //console.log("文档更新成功");
                            db.close();
                        });
                    }
                    callback(null, "ok");
                });
            });
        }
    ], function (err, result) {
        res.end(result);
    });
});
//设置star
app.post('/setStared', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.stared);
        },
        function (xuehao, stared, callback) {
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                //console.log("数据库已连接!");
                var dbSylu = db.db("syluCloud");
                //修改数据
                var findData = { xuehao: xuehao };
                var insertData = {
                    xuehao: xuehao,
                    star: stared
                };
                var upData = {
                    $set: {
                        star: stared
                    }
                };
                dbSylu.collection("viewAndStar").find(findData).toArray(function (err, result) { // 返回集合中所有数据
                    if (err) throw err;
                    if (result.length == 0) {
                        dbSylu.collection("viewAndStar").insertOne(insertData, function (err, res) {
                            if (err) throw err;
                            //console.log("文档插入成功");
                            db.close();
                        });
                    } else {
                        dbSylu.collection("viewAndStar").updateOne(findData, upData, function (err, res) {
                            if (err) throw err;
                            //console.log("文档更新成功");
                            db.close();
                        });
                    }
                    callback(null, "ok");
                });
            });
        }
    ], function (err, result) {
        res.end(result);
    });
});
//验证学生学号密码等功能，测试完成，可以使用
app.post('/checkStudentAccount', function (req, res) {
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
                            saveStudentBasicInfo(xuehao, mima, xingming);
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
            account: result != null,
            name: result
        };
        res.end(JSON.stringify(response));
    });
});
//获取课程表功能测试通过，待优化，没有错误处理，返回 json 数据
app.post('/getSource', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.mima);
        },
        function (xuehao, mima, callback) {
            var sourceList = new Array();
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
                            re = /(<br|rowspan=\"2\"|width=\"7%\")>[^<](\S+?)<br>周(一|二|三|四|五|六|日)第(1|3|5|7|9|11),(2|4|6|8|10|12)节{第(\d+)-(\d+)周}<br>(\S+?)<br>(\S+?)<(br>|\/td>)/g;
                            //re = /<td align="Center" rowspan="2"\s{0,1}\S{0,10}>(\S+)<br>(周\S+)<br>(\S+)<br>([A-Z]{0,4}-\d+)<\/td>/g;
                            var course = body.match(re);
                            var source_id = 0;
                            if (course) {
                                for (let index = 0; index < course.length; index++) {
                                    var element = course[index];
                                    console.log(element);
                                    tempRe = />(\S+?)<br>周(一|二|三|四|五|六|日)第(1|3|5|7|9|11),\d{1,2}节{第(\d+)-(\d+)周}<br>(\S+?)<br>(\S+?)</;
                                    var sourceArray = element.match(tempRe);
                                    sourceList[source_id] = {
                                        sourceId: source_id++,
                                        sourceName: sourceArray[1],
                                        sourceClassRoom: sourceArray[7],
                                        sourceStartWeek: sourceArray[4],
                                        sourceEndWeek: sourceArray[5],
                                        sourceWeekDay: weekCHineseToNumber(sourceArray[2]),
                                        sourceTime: sourceArray[3],
                                        sourceTeacher: sourceArray[6],
                                        sourceSingleWeek: 0
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
                                    saveStudentSource(xuehao, xuenian, xueqi, sourceList);
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
                            callback(null, sourceList);

                        });
                    });
                });
            });

        },
    ], function (err, result) {
        res.end(JSON.stringify(result));
    });
});
//获取历年成绩测试通过，待优化，没有错误处理，返回 json 数据
app.post('/getMark', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.mima);
        },
        function (xuehao, mima, callback) {
            var markList = new Array();
            var markId = 0;
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
                        var tempUrl = sessurl + "xscjcx.aspx?xh=" + xuehao + "&xm=" + strToUrlgb2312(xingming) + "&gnmkdm=N121605";
                        request.get({ url: tempUrl, encoding: null, forever: true, headers: header }, function (err, response, body) {
                            //console.log(iconv.decode(body, 'gb2312'));
                            $ = cheerio.load(iconv.decode(body, 'gb2312'));
                            var viewstate = $('input').attr('name', '__VIEWSTATE')[2].attribs.value;
                            //console.log(viewstate)
                            header = {
                                'Referer': tempUrl,
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36'
                            };
                            formData = {
                                '__EVENTTARGET': '',
                                '__EVENTARGUMENT': '',
                                '__VIEWSTATE': iconv.encode(viewstate, 'gb2312'),
                                //'__VIEWSTATE':$('input').attr('value'),
                                'hidLanguage': '',
                                'ddlXN': '',
                                'ddlXQ': '',
                                'ddl_kcxz': '',
                                'btn_zcj': strToUrlgb2312("历年成绩")//学期成绩为'btn_xq':strToUrlgb2312("学期成绩")
                            };
                            request.post({ url: tempUrl, encoding: null, form: formData, forever: true, headers: header }, function (err, response, body) {
                                //$ = cheerio.load(iconv.decode(body, 'gb2312'));
                                //callback(null,body);
                                body = iconv.decode(body, 'gb2312');
                                Re = /<tr(\sclass="alt")?>\s+<td>20\d{2}-20\d{2}<\/td><td>[1|2|3]\S+<\/td><td><\/td><td>(重修)?<\/td>\s+<\/tr>/g;
                                var markArr = body.match(Re);
                                if (markArr) {
                                    for (let index = 0; index < markArr.length; index++) {
                                        const element = markArr[index];
                                        tempRe = /<.*?>(20\d{2}-20\d{2}\S+)<\/td>\s+<\/tr>/;
                                        var markIndex = element.match(tempRe)[1]
                                        var lastTemp = markIndex.split("</td><td>");
                                        markList[markId] = {
                                            markId: markId++,
                                            markYear: lastTemp[0],
                                            markSemester: lastTemp[1],
                                            markNumber: lastTemp[2],
                                            markStatus: lastTemp[3],
                                            markClass: lastTemp[4],
                                            markWidget: lastTemp[6],
                                            markValue: lastTemp[7],
                                            checked: false
                                        };
                                    }
                                    saveStudentMark(xuehao, markList);
                                    //console.log(markList);
                                } else {
                                    markList[0] = {
                                        markId: 0,
                                        markYear: null,
                                        markSemester: null,
                                        markNumber: null,
                                        markStatus: null,
                                        markClass: null,
                                        markWidget: null,
                                        markValue: null,
                                        checked: false
                                    };
                                }
                                callback(null, markList);
                            })
                        });
                    });
                });
            });
        },
    ], function (err, result) {
        res.end(JSON.stringify(result));
    });
});
//获取专业课列表，返回 json
app.post('/getSpeSource', function (req, res) {
    async.waterfall([
        function (callback) {
            callback(null, req.body.xuehao, req.body.mima);
        },
        function (xuehao, mima, callback) {
            var zhuanyeNum = xuehao.substring(0, 8);
            console.log(zhuanyeNum);
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                //console.log("数据库已连接!");
                var dbSylu = db.db("syluCloud");
                var findData = { zhuanyeNum: zhuanyeNum };
                dbSylu.collection("studentSpecialities").find(findData).toArray(function (err, result) {
                    //console.log(result)
                    if (err) throw err;
                    callback(null, result, zhuanyeNum, xuehao, mima)
                    db.close();
                });
            });
        }, function (resuData, zhuanyeNum, xuehao, mima, callback) {
            if (resuData.length == 0) {
                var xueweiList = [];
                callback(null, xueweiList);
                getXuewei(xuehao, mima, function (xueweiList) {
                    xueweiList = xueweiList;
                    console.log("获取到的列表：");
                    console.log(xueweiList);
                    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                        if (err) throw err;
                        //console.log("数据库已连接!");
                        var dbSylu = db.db("syluCloud");
                        var insertData = {
                            zhuanyeNum: zhuanyeNum,
                            xueweiList: xueweiList
                        }
                        dbSylu.collection("studentSpecialities").insertOne(insertData, function (err, res) {
                            if (err) throw err;
                            //console.log("文档插入成功");
                            db.close();
                        });

                    });
                });
            } else {
                console.log(resuData[0].xueweiList)
                callback(null, resuData[0].xueweiList);
            }
        }
        // , function (xueweiList, callback) {
        //     callback(null, xueweiList);
        //     // if (statNum == 1) {

        //     // } else if (statNum == 2) {
        //     //     callback(null, xueweiList);
        //     // }
        // }

    ], function (err, result) {
        res.end(JSON.stringify(result));
    })
});

var server = app.listen({ host: 'localhost', port: 3000 }, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})
