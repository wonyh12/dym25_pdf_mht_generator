var express = require('express');
var router = express.Router();

var filedown = require('../mht_pdf_down');

var fileList = require('../mht_pdf_list');

var zipCreate = require('../zipCreate');

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
    filePwd: "123456789"
};

function initVO(vo){
	vo.recruit_folder_name = "";
	vo.etc_col = "";
	vo.field1 = "";
    vo.field2 = "";
    vo.field3 = "";
    vo.field4 = "";
    vo.limit_snum = "0";
    vo.limit_setting = 300;
    vo.limit_total_loop = "";
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '파일 다운로드',
					  	type : req.query.type,
					  	fileType : req.query.fileType,
  						recruit_name : req.query.recruit_name,
  						recruit_num : req.query.recruit_num,
  						request_step_condition : req.query.request_step_condition,
  						snum : req.query.snum,
  						limit_total : req.query.limit_total,
  						filePwd : req.query.filePwd,
  						fileYN : ''
  });
});



//router.post('/', function(req, res, next) {
//	console.log(req.body);
//	
//	settingVO.type = req.body.type;
//	settingVO.recruit_name = req.body.recruit_name;
//	settingVO.recruit_num = req.body.recruit_num;
//	settingVO.request_step_condition = req.body.request_step_condition;
//	settingVO.snum = req.body.snum;
//	settingVO.limit_total = req.body.limit_total;
//	settingVO.filePwd = req.body.filePwd;
//	
//	filedown(settingVO,res);
//
//  	res.render('index', { title: '파일 다운로드',
//					  	type : req.body.type,
//					  	fileType : req.body.fileType,
//  						recruit_name : req.body.recruit_name,
//  						recruit_num : req.body.recruit_num,
//  						request_step_condition : req.body.request_step_condition,
//  						snum : req.body.snum,
//  						limit_total : req.body.limit_total,
//  						filePwd : req.query.filePwd,
//  						fileYN : 'Y'
//  });
//});

router.post('/create', function(req, res, next) {
	console.log(req.body);
	
	initVO(settingVO);
	
	settingVO.type = req.body.type;
	settingVO.recruit_name = req.body.recruit_name;
	settingVO.recruit_num = req.body.recruit_num;
	settingVO.request_step_condition = req.body.request_step_condition;
	settingVO.snum = req.body.snum;
	settingVO.limit_total = req.body.limit_total;
	settingVO.filePwd = req.body.filePwd;
	
	console.log(settingVO);
	
	fileList(settingVO, res);
	//next();

});

router.post('/createFile', function(req, res, next) {
	console.log(req.body);
	
	filedown(settingVO, req, res);
	//next();

});
router.post('/zipCreate', function(req, res, next) {
	console.log(req.body);
	console.log(req.body.recruit_name);
	zipCreate(settingVO, res, req);
	//next();

});

router.post('/download', function(req, res, next) {

	var file = './download/'+req.body.down_recruit_name+'.zip';
	console.log(file);
  	res.download(file); 
});



module.exports = router;

