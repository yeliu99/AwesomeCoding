var express = require('express');
var router = express.Router();
var get_connection = require('../utils/database');

function do_sql_query(sql, callback) {           // 执行数据库命令
    var result = {};
    result.query = sql;
    result.results = [];
    result.status = 'SUCCESS.';
    get_connection(function (conn) {
        conn.query(sql, function (error, results, fields) {
            if (error) {
                result.status = 'FAILED.';
                result.details = error;
                callback(result);
            } else {
                for (var i = 0; i < results.length; i++) {
                    result.results.push(results[i]);
                }
                callback(result);
            }
        });
    });
}

router.get('/show_table', function(req, res, next) { //在数据库中查找表格，并打印
    var sql = 'SELECT * FROM ' + req.query.table_name;
    do_sql_query(sql, function (result) {
        res.send(JSON.stringify(result, null, 3));
    });
});

router.get('/show_columns', function(req, res, next) {
	var mysql_config = require('../configures/db_configures');
	var db_name = mysql_config.database;
	var table_name = mysql_config.table;
	var sql = 'SELECT (COLUMN_NAME) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'
		+ db_name + '" AND TABLE_NAME = "' + req.query.table_name + '"';
    do_sql_query(sql, function (result) {
        res.send(JSON.stringify(result, null, 3));
    });
});


router.get('/do_query', function (req, res, next) { //在数据库中执行指定的SQL命令
	var sql = req.query.sql;
	do_sql_query(sql, function (result) {
		res.send(JSON.stringify(result, null, 3));
	});
});


router.get('/delete_class', function(req, res, next) { //根据id删除班级
	var id = req.query.id;
	var sql = 'DELETE FROM classes WHERE id = ' + id;
	do_sql_query(sql,function(result) {
		res.send(JSON.stringify(result,null,3));
	});
	sql = 'DELETE FROM classusers WHERE id = ' + id;
	do_sql_query(sql,function(result) {
		//to do more,设计更好的适合前段解析的返回
	});
});



router.get('/create_class', function(req, res, next) { //创建新班级
	var id = req.query.id;
	if (id == undefined) {
		console.log('id is a must');
		return;
	} else {
		//判重处理
		var sql = 'SELECT * FROM classes WHERE id = ' + id;
		var tag = 0;
		do_sql_query(sql, function(result) {
			var id = req.query.id;
			for(var i = 0; i < result.results.length; i++){
				console.log(id);
				if(id == result.results[i].id){
					console.log('id already exsited');
					tag = 1;
					break;
				}
			}
			if (tag === 1) {
				res.send('0');
				return;
			} else {
				var id = (req.query.id == undefined? null: req.query.id);
				var notice = (req.query.notice == undefined? null: req.query.notice);
				var title = (req.query.title == undefined? null: req.query.title);
				var registration_date = (req.query.registration_date == undefined? null: req.query.registration_date);
				var password = (req.query.password == undefined? null: req.query.password);
				sql = 'INSERT INTO classes VALUES (' +
					id + ',' +
					JSON.stringify(notice) + ',' +
					JSON.stringify(title) + ',' +
					registration_date + ',' +
					JSON.stringify(password) + ")";
				do_sql_query(sql,function(result) {
					res.send(JSON.stringify(result,null,3));
				});
			}
		});
	}
})


//分页获取
router.get('/get_classes_list', function(req, res, next) {
	var m = (req.query.m == undefined? null: req.query.m); //从第几条开始取
	var n = (req.query.n == undefined? null: req.query.n);
	var sql = 'SELECT * FROM classes limit ' + m + ',' + n;
	do_sql_query(sql,function(result) {
		res.send(JSON.stringify(result,null,3));
	});
})


router.get('/login', function(req, res, next) { // 登录合法判断,0代表用户名不存在,1代表合法,2代表密码错误
	var nickname = req.query.nickname;
	var password = req.query.password;
	var sql = 'SELECT * FROM users';
	do_sql_query(sql,function(result) {
		for(var i=0;i<result.results.length;i++){
			if(nickname==result.results[i].nickname){
				if(password==result.results[i].password){
					res.send('1');
					return;
				}
				else{
					res.send('2');
					return;
				}
			}
		}
		res.send('0');
		return;
	});
	console.log(next);
});

router.get('/register', function(req,res,next) { //注册新用户,0代表用户名重复，1代表注册成功
	var nickname=req.query.nickname;
	var password=req.query.password;
	if(nickname==undefined || password==undefined){
		console.log("no nickname or password");
		return;
	}
	var sql = 'SELECT * FROM users';
	var tag=0;
	console.log(nickname);
	//判重
	do_sql_query(sql,function(result) {
		for(var i=0;i<result.results.length;i++){
			if(nickname==result.results[i].nickname){
				tag=1;
			}
		}
		var id = (req.query.id == undefined? null: req.query.id);
		var realname = (req.query.realname == undefined? null: req.query.realname);
		var role = (req.query.role == undefined? null: req.query.role);
		var motto = (req.query.motto == undefined? null: req.query.motto);
		var registration_date = (req.query.registration_date == undefined? null: req.query.registration_date);
		sql = 'insert into users values (' +
			id + ',' +
			JSON.stringify(nickname) + ',' +
			JSON.stringify(realname) + ',' +
			role + ',' +
			JSON.stringify(motto) + ','+
			registration_date + ',' +
			JSON.stringify(password) + ')';
		console.log(sql);
		if(tag===1) res.send('0');
		else{
			do_sql_query(sql,function(result) {
				res.send('1');
			});
		}
	});
});

module.exports = router;
