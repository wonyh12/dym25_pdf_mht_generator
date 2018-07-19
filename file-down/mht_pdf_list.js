/*************************************************************************************/
/*
.v1 : mht 만 가능하던 다운로드에서 mht, pdf 다운로드 합침
.v2 : 수험번호가 없는 지원자들 성명이 중복 될 경우 파일이 엎어짐 ( 즉 파일개수가 안맞음 )
.v3 : 수험표 개별 다운로드 기능 추가, etc_col 기타 컬럼 추가
.v4 : PDF 생성시 sleep 제거, 소스 리펙토링, 제작수험표 개별 다운로드 기능 추가 //2017-12-05
.v5 : 특정분야만 다운로드 기능 추가 //2017-12-08
node 웹서버 실행 : node ./bin/www
개발서버는 mht변환시 로그인 인증이 완료되었다고 뜸
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


function updateVO(vo) {
	urlList = [];
	filePathList = [];
    vo.type = vo.type.toLowerCase();
    vo.fileType = vo.fileType.toLowerCase();
    vo.limit_total_loop = Math.ceil(vo.limit_total / vo.limit_setting);
    if (vo.limit_total < vo.limit_setting) {
        vo.limit_setting = vo.limit_total;
    }
    //vo 초기화를 생각해야함
    if (!vo.recruit_folder_name) {
       vo.recruit_folder_name = vo.recruit_name;
    }
    
    return vo;
}

function listUpStart(vo, res) {
	
    vo = updateVO(vo);
    
    var temp_field, dataList, isfail,
        requestUrl = { "1" : "http://hr25.dymdev.saramin.co.kr/super_admin/common/func/node_mht_json.asp",
					   "2" : "https://hr25.saramin.co.kr/super_admin/common/func/node_mht_json.asp"
					 }[vo.server],
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
                var pushList = function() {
                        if (Math.ceil(urlList.length / vo.limit_setting) == vo.limit_total_loop) {
                            return {
                                "mht": resList,
								"pdf": resList
                            }[vo.fileType](vo, res);
                        }
                    },
                    getPushFile = function() {
                        return temp_field + "/" + getName() + "." + vo.fileType;
                    },
                    getPushUrl = function() {
                        var defaultUrl = { 
										"1": "http://" + vo.recruit_folder_name + ".dymdev.saramin.co.kr",
										"2": "https://" + vo.recruit_folder_name + ".saramin.co.kr"
										}[vo.server],
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
                        if (field && field != "personal") {
							console.log(field);
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
                        // temp_field = makeFolder(getTempField(temp_field, eval(vo.folderGubun[key])));
						temp_field = makeFolder(getTempField(temp_field, getName(vo.folderGubun[key])));
                    }

                    urlList.push(getPushUrl());
                    filePathList.push(getPushFile());
                }
                
                
                pushList();
				
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

function resList(vo, res) {
       
    console.log("-------------------------------------start-------------------------------------");
    for (var i = 0, len = urlList.length; i < len; i++) {
        fileNameCheck(i, vo);

       	res.write( urlList[i] +'\n'+ filePathList[i]  +'\n');
       	console.log( urlList[i] +'\n'+ filePathList[i]  +'\n');
    }
    res.end();
    console.log("--------------------------------------end--------------------------------------");
    
}

function fileNameCheck(i, vo) {
    if (fs.existsSync(filePathList[i])) {
        filePathList[i] = filePathList[i].replace("." + vo.fileType, i + "." + vo.fileType);
    }
}


module.exports = listUpStart;