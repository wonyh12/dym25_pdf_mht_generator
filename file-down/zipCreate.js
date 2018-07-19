/*************************************************************************************/
/*
.v1 : mht 만 가능하던 다운로드에서 mht, pdf 다운로드 합침
.v2 : 수험번호가 없는 지원자들 성명이 중복 될 경우 파일이 엎어짐 ( 즉 파일개수가 안맞음 )
.v3 : 수험표 개별 다운로드 기능 추가, etc_col 기타 컬럼 추가
.v4 : PDF 생성시 sleep 제거, 소스 리펙토링, 제작수험표 개별 다운로드 기능 추가 //2017-12-05
.v5 : 특정분야만 다운로드 기능 추가 //2017-12-08
node 웹서버 실행 : node ./bin/www
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