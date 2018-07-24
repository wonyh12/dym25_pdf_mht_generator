/*************************************************************************************/
/*

함수 정리

chilkatObjVO : os 정보를 받아서 필요한 라이브러리 호출 시킴(mht 라이브러리)

logFile : 로그 파일 위치

messageVO : 로그에 넣을 메세지 함수

downStart : 
	- /crateFile 실제 실행 함수
	- fileType 값에 따라 mht, pdf 다운로드 함수 분기처리

mhtDown : chilkat 사용, mht 생성

pdfDown : spawn 사용, pdf 생성

logAction : 로그 쌓는 함수

getDateTime : 현재 시간 가져오는 함수

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

// function chilkatObjVO(os) {
//     return {
//         'win32': 'chilkat_node6_win32',
//         'linux': {
//             'arm': 'chilkat_node6_arm',
//             'x86': 'chilkat_node6_linux32'
//         }[os.arch()] || 'chilkat_node8_linux64',
//         'darwin': 'chilkat_node6_macosx'
//     }[os.platform()];
// }

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