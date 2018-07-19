/*************************************************************************************/
/*
.v1 : mht 만 가능하던 다운로드에서 mht, pdf 다운로드 합침
.v2 : 수험번호가 없는 지원자들 성명이 중복 될 경우 파일이 엎어짐 ( 즉 파일개수가 안맞음 )
.v3 : 수험표 개별 다운로드 기능 추가, etc_col 기타 컬럼 추가
.v4 : PDF 생성시 sleep 제거, 소스 리펙토링, 제작수험표 개별 다운로드 기능 추가 //2017-12-05
.v5 : 특정분야만 다운로드 기능 추가 //2017-12-08
node 웹서버 실행 : node ./bin/www
*/

//const exec = require('child_process');
var spawn = require('child_process').spawn;
const Promise = require('Promise');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const cmd = require('async-exec-cmd');
const os = require('os');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
const chilkat = require(chilkatObjVO(os));
var zipFolder = require('zip-folder');


const logFile = function(isSuccess) {
    return isSuccess ? "download/downSuccessLog.txt" : "download/downFailLog.txt";
};


/*********************************** 세팅 끝 ***********************************/


function chilkatObjVO(os) {
    return {
        'win32': 'chilkat_node6_win32',
        'linux': {
            'arm': 'chilkat_node6_arm',
            'x86': 'chilkat_node6_linux32'
        }[os.arch()] || 'chilkat_node6_linux64',
        'darwin': 'chilkat_node6_macosx'
    }[os.platform()];
}

function messageVO(vo, isSuccess, i, list) {
    var type = {
        "resume": "이력서",
        "apply_print": "수험표",
        "exam_card": "제작수험표"
    }[vo.type];
    return (getDateTime() + ' [' + type + ']' + ' [' + vo.fileType.toUpperCase() + '] ' + (isSuccess ? 'SUCCESS' : 'FAIL') + ' : [' + (i + 1) + '/' + list.length + ']  ' + list[i]);
}


function downStart(vo, req, res) {
	var saveFile = function() {
                            return {
                                "pdf": pdfDown,
                                "mht": mhtDown
                            }[vo.fileType](req, res);
                    };
    saveFile();
}

function mhtDown(req, res) {
    var mhtMakeState,
        mht = new chilkat.Mht(),
        mhtIsFail = !mht.UnlockComponent("Anything for 30-day trial");

    if (mhtIsFail) {
        console.log(mht.LastErrorText);
        return;
    }
    
    console.log("-------------------------------------start-------------------------------------");

        mhtMakeState = (!!mht.GetAndSaveMHT(req.body.urlList, req.body.fileList));
        //logAction(vo, i, filePathList, mhtMakeState);
       	res.write( req.body.fileList +'\n');
       	console.log( req.body.fileList +'\n' );

    res.end();
    console.log("--------------------------------------end--------------------------------------");
    
}

function pdfDown(req, res) {
	var pdfMake = spawn('electron-pdf', [req.body.urlList, req.body.fileList, '-m 0']);
				console.log("-------------------------------------start-------------------------------------");
				pdfMake.on('exit', function(code) {
					res.write( req.body.fileList +'\n');
       				console.log( req.body.fileList +'\n' );
					res.end();
					console.log("--------------------------------------end--------------------------------------");
				});
				pdfMake.on('error', function(err) {
					console.log(err);
				});
}


function logAction(vo, i, list, state, exception) {
    console.log(messageVO(vo, state, i, list));
	
    fs.appendFileSync(logFile(state), messageVO(vo, state, i, list) + os.EOL);
    if (exception) {
        console.log(exception);
        fs.appendFileSync(logFile(state), getDateTime() + "   " + exception + os.EOL);
    }
}


function getDateTime() {
    var dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    return dateTime;
}


module.exports = downStart;