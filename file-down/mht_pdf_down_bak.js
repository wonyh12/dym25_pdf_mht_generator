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

var json;
var urlList = []; // 데이터 받아올 주소
var filePathList = []; // 파일경로

var settingVO = {
    type: "resume", // 이력서(resume) , 수험표(apply_print), 제작수험표(exam_card)
    fileType: "mht", // 다운받을 파일 타입 (mht, pdf)
    recruit_name: "lh", // 업체 영문명(도메인)
    recruit_folder_name: "", // 폴더명과 디비명이 다를때 이것도 입력 같으면 입력 하지 말것
    recruit_num: "899", // 업체 공고번호
    request_step_condition: "2", // 진행상태 숫자 전체일땐 "" ex) 7 (7이 최종합격란이고 최종합격 인 애들만 뽑는다고 가정할때)
    limit_total: 10, // 테스트로 몇개만 하고 싶을땐 입력 ex) 10 // 총갯수를 적어줘야함 //
    condition_name: "", // 진행상태 이름설정, 안쓸때는 "" 처리
    snum: "Y", // Y 값 넣으면 수험번호 있는 애들만.
    etc_col: "", //print_num, mapping1 등등 필요한 컬럼 추가
    folderGubun: { // 폴더 구분 field1 > field2 > field3 > field4 > 개인별
        "field1": "getName('field1')"
        ,"field2": "getName('field2')"
        ,"field3": "getName('field3')"
        ,"field4": "getName('field4')"
        ,"개인별": "getName()"
    },
    field1: "", // 분야명 입력 시 해당 분야만 다운로드
    field2: "",
    field3: "",
    field4: "",
    limit_snum: "0",
    limit_setting: 300,
    limit_total_loop: "",
    filePwd: "1234556789"
};

/*********************************** 세팅 끝 ***********************************/

//downStart(settingVO);

function chilkatObjVO(os) {
    return {
        'win32': 'chilkat_node6_win32',
        'linux': {
            'arm': 'chilkat_node6_arm',
            'x86': 'chilkat_node6_linux32'
        }[os.arch()] || 'chilkat_node8_linux64',
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

function updateVO(vo) {
	urlList = [];
    vo.type = vo.type.toLowerCase();
    vo.fileType = vo.fileType.toLowerCase();
    vo.limit_total_loop = Math.ceil(vo.limit_total / vo.limit_setting);
    if (vo.limit_total < vo.limit_setting) {
        vo.limit_setting = vo.limit_total
    }
    if (!vo.recruit_folder_name) {
        vo.recruit_folder_name = vo.recruit_name;
    }
    return vo;
}

function downStart(vo, res) {
	
    vo = updateVO(vo);
    var temp_field, dataList, isfail,
        requestUrl = "http://hr25.dymdev.saramin.co.kr/super_admin/common/func/node_mht_json.asp",
        getParameter = function(vo) {
            var param = "company_name=" + vo.recruit_name + "&recruit_idx=" + vo.recruit_num + "&request_step_condition=" + vo.request_step_condition + "&limit_snum=" + vo.limit_snum+ "&limit_enum=" + vo.limit_setting + "&snum=" + vo.snum + "&etc_col=" + vo.etc_col;
                param = param + "&field1=" + encodeURIComponent(vo.field1)+ "&field2=" + encodeURIComponent(vo.field2)+ "&field3=" + encodeURIComponent(vo.field3)+ "&field4=" + encodeURIComponent(vo.field4);
            return param;
        },
        requestOptions = function(vo) {
            return {
                url: requestUrl + "?" + getParameter(vo),
                headers: {
                    'user-agent': 'mht'
                },
                rejectUnauthorized: false,
                followAllRedirects: true
            };
        };

    for (k = 0, len = vo.limit_total_loop; k < len; k++) {
        request(requestOptions(vo), function(error, response, body) {
            isfail = (!error && response.statusCode == 200);
            if (isfail) {
                json = JSON.parse(body);
                var saveFile = function() {
                        if (Math.ceil(urlList.length / vo.limit_setting) == vo.limit_total_loop) {
                            return {
                                "pdf": pdfDown,
                                "mht": chilkatExample
                            }[vo.fileType](vo, res);
                        }
                    },
                    getPushFile = function() {
                        return temp_field + "/" + getName() + "." + vo.fileType;
                    },
                    getPushUrl = function() {
                        var defaultUrl = "http://" + vo.recruit_folder_name + ".dymdev.saramin.co.kr",
                            printUrl = {
                                "apply_print": "/service/" + vo.recruit_folder_name + "/" + vo.recruit_num + "/applicant/pass/apply_print.asp?downfile=Y&recruit_idx=" + vo.recruit_num + "&user_idx=" + dataList['user_idx'],
                                "exam_card": "/common/admin/pass/exam_card_page_view.asp?downfile=Y&recruit_idx=" + vo.recruit_num + "&user_idx=" + dataList['user_idx'],
                                "resume": "/service/" + vo.recruit_folder_name + "/" + vo.recruit_num + "/admin/applicant/applicant_resume_view_mht.asp?downfile=Y&id_no_enc=" + dataList['id_no_enc']
                            }[vo.type] || "/admin/applicant/applicant_resume_view_mht.asp?downfile=Y&id_no_enc=" + dataList['id_no_enc'];
                        return defaultUrl + printUrl;
                    },
                    getTempField = function(temp_field, folderName) {
                        return temp_field = temp_field + "/" + folderName;
                    },
                    getName = function(field) {
                        if (field) {
                            dataList[field] = dataList[field].replace(/\//gi, "_").replace(/\s/gi, "_");
                            return dataList[field];
                        } else {
                            return dataList[vo.etc_col || 'snum'] + "_" + dataList['kor_name'];
                        }
                    },
                    makeFolder = function(temp_field) {
                        if (!fs.existsSync(temp_field)) {
                            fs.mkdirSync(temp_field);
                        }
                        return temp_field;
                    };

                for (var i = 0, len = json.list.length; i < len; i++) {
                    dataList = json.list[i];
                    temp_field = makeFolder("download"); // 기본 폴더
                    temp_field = makeFolder(getTempField(temp_field, vo.recruit_name)); // 업체폴더 기본값

                    //temp_field = makeFolder(vo.recruit_name); // 업체폴더 기본값

                    if (vo.condition_name) { // 분야위에 상위폴더 생성하고 싶을때(ex 진행상태명)
                        temp_field = makeFolder(getTempField(temp_field, vo.condition_name));
                    }

                    // 폴더 생성
                    for (var key in vo.folderGubun) {
                        temp_field = makeFolder(getTempField(temp_field, eval(vo.folderGubun[key])));
                    }

                    urlList.push(getPushUrl());
                    filePathList.push(getPushFile());
                }
                saveFile();
				return true;
            } else {
                console.log("error>>>>>>>>>" + error);
                console.log("response statusCode>>>>>>>>>" + response.statusCode);
                console.log("response body>>>>>>>>>" + response.body);
                return false;
            }
        });
        vo.limit_snum = Number(vo.limit_snum) + Number(vo.limit_setting);
    }

}

function chilkatExample(vo, res) {
    var mhtMakeState,
        mht = new chilkat.Mht(),
        mhtIsFail = !mht.UnlockComponent("Anything for 30-day trial");

    if (mhtIsFail) {
        console.log(mht.LastErrorText);
        return;
    }

    
    
    console.log("-------------------------------------start-------------------------------------");
    for (var i = 0, len = urlList.length; i < len; i++) {
        fileNameCheck(i, vo);
        mhtMakeState = (!!mht.GetAndSaveMHT(urlList[i], filePathList[i]));
        logAction(vo, i, filePathList, mhtMakeState);

       	res.write( (i+1)+'///'+urlList.length +'\n');
       	console.log( (i+1)+'///'+urlList.length +'\n' );
    }
    res.end();
    console.log("--------------------------------------end--------------------------------------");
    
    zipCreate(vo);
}

function zipCreate(vo){
	
	var zip = spawn('zip',['-r9P', vo.filePwd, 'download/'+vo.recruit_name+'.zip', 'download/'+vo.recruit_name+'/']);
	zip.on('exit', function(code) {
		console.log('zip Created!!');
	});
	zip.on('error', function(err) {
		console.log(err);
	});
	
}

function pdfDown(vo) {

    var textArray = [];
    for (var i = 0, len = urlList.length; i < len; i++) {
        fileNameCheck(i, vo);
        textArray[i] = 'electron-pdf ' + urlList[i] + ' ' + filePathList[i] + ' ';
    }
    var pdfStr,
        index = 0,
        cmdPdf = function() {
            console.log("-------------------------------------start-------------------------------------");
            try {
                cmd(textArray[index], callback);
            } catch (exception) {
                logAction(index, filePathList, false, exception);
            }
        },
        callback = function(err, res, code, buffer) {
            var isError = (!err),
                isRunning = (index != (textArray.length - 1)),
                running = function() {
                    index++;
                    cmd(textArray[index], callback);
                },
                end = function() {
                    console.log("--------------------------------------end--------------------------------------");
                },
                pdfDownload = function() {
                    return isRunning ? running() : end();
                };
            logAction(vo, index, filePathList, isError, err);
            pdfDownload();
        };
    cmdPdf();
}

function logAction(vo, i, list, state, exception) {
    console.log(messageVO(vo, state, i, list));
	
    fs.appendFileSync(logFile(state), messageVO(vo, state, i, list) + os.EOL);
    if (exception) {
        console.log(exception);
        fs.appendFileSync(logFile(state), getDateTime() + "   " + exception + os.EOL);
    }
}

function fileNameCheck(i, vo) {
    if (fs.existsSync(filePathList[i])) {
        filePathList[i] = filePathList[i].replace("." + vo.fileType, i + "." + vo.fileType);
    }
}

function getDateTime() {
    var dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    return dateTime;
}


module.exports = downStart;