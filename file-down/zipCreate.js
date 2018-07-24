/*************************************************************************************/
/*

함수 정리

zipCreate : 
	- 압축 함수
	- 1단계 압축 : 업체영문명_temp.zip 로 1차 압축 ( 파일명, 폴더명 한글 깨짐 방지 ) , zipFolder 라이브러리 사용
	- 2단계 압축 : 업체영문명_temp.zip -> 업체영문명.zip 으로 압축 ( 패스워드 추가 )
	- 업체영문명_temp.zip 파일 삭제
*/

var spawn = require('child_process').spawn;

var zipFolder = require('zip-folder');


/*********************************** 세팅 끝 ***********************************/


function zipCreate(vo, res, req){
	zipFolder('download/'+req.body.recruit_name, 'download/'+req.body.recruit_name+'_temp.zip', function(err) {
		if(err) {
			console.log('oh no!', err);
		} else {

			console.log('temp zip Created');
			var zip = spawn('zip',['-r1P', req.body.filePwd, 'download/'+req.body.recruit_name+'.zip', 'download/'+req.body.recruit_name+'_temp.zip']);
			zip.on('exit', function(code) {
				res.write('Y');
				console.log('zip Created!!');
				spawn('rm',['download/'+req.body.recruit_name+'_temp.zip']);
				res.status(200).end();
			});
			zip.on('error', function(err) {
				console.log(err);
			});

		}
	 });
}


module.exports = zipCreate;