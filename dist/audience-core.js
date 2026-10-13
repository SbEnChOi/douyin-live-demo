(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiveAudienceCore=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const people=['小雨','奶茶三分糖','星星不睡觉','阿晨','是小鹿呀','晚风'];
 const filterNames={bunny:'兔子',pig:'小猪',uncle:'大叔'};
 const pools={
  bunny:['不是哥们，这眼睛是开了两个浏览器窗口吗😂','门牙先下播吧，主播还得继续播','绷不住了，眼睛已经进直播间，人还在路上','这兔子看着像刚被数学题打了一顿','牙齿有自己的粉丝团是吧哈哈哈','主播脑子没上线，门牙倒是满勤🥕'],
  pig:['不是，这鼻子是不是单独办了房产证🐽','哥们一开滤镜，鼻孔直接变海景房','鼻子这么大，是要闻到明年的饭吗😂','你别认真说话，我现在听什么都像猪在开会','这猪鼻子比我的人生目标还清晰','笑死，鼻孔宽带比我家网速都高'],
  uncle:['哥们一秒从学生变成小区保安队长🥸','这胡子能扫地吧，省一把扫帚钱','不是，你这发型是不是被生活抓过😂','眼镜一戴，欠我两百块的大叔回来了','胡子都开播了，主播只是顺便','别关这个滤镜，我已经开始喊叔了'],
  fireworks:['谁家直播间突然炸年会啊🎆','我就点个赞，你怎么把春晚搬来了','这烟花一放，钱包先替我喊救命','不是哥们，这排面是中了五块钱吗😂','刚进来就过年了，红包呢主播'],
  fire:['不是哥们，你直播间炒菜没开抽油烟机吗🔥','好家伙，主播现在自带煤气灶','这个直播间能顺便帮我烤个红薯不','弹幕都熟了，谁来翻个面😂','火力是满了，脑回路还在预热'],
  party:['这么多彩纸，保洁阿姨知道吗🎉','不是哥们，中个小奖你开这么大派对啊','弹幕还没看完，纸屑先给我洗脸了','快乐是你们的，扫地是明天的😂','这纸撒得，我以为打印机叛变了'],
  face_enter:['哦豁，主播上线了，我的笑点准备下线了','哥们闪亮登场，弹幕CPU开始预热👋','人来了，节目效果也该交作业了吧'],
  face_close:['不是哥们，你都快钻我手机里了😂','离这么近，屏幕钢化膜都要喊你哥了','别靠这么近，我的手机有社恐'],
  face_away:['哥们你怎么跑了，弹幕又不收门票','主播退半步，网友进半步是吧😂','回来，刚准备给你打个零分你就跑了'],
  face_move:['不是哥们，椅子烫屁股吗，怎么晃来晃去😂','主播这个走位，游戏里得被举报','别晃了，我的眼睛在加班'],
  face_many:['哦豁，画面里组队了，谁是队长👀','旁边那个也别装路人，一起交作业','一个人不够离谱，还叫队友一起是吧😂'],
  general:['主播你先整活，我的笑点已经坐下了','不是哥们，这直播间有点东西啊','刚进来，我看不懂但大受震撼😂','谁把我的退出键藏起来了，怎么还在看','认真看了三分钟，感觉脑子亏了五分钟','我妈问我笑什么，我说手机在发疯','主播别努力了，节目效果已经努力过了','哥们这直播间连空气都带点抽象','一边看一边喝奶茶，差点从鼻子喝出来','本来想划走的，结果手指也在看戏','你们负责整活，我负责发哈哈哈哈','主播这个状态，像周一的我但是放大版','别下播，我脑子刚开始适应你们','打个招呼吧，别让我的弹幕尴尬地站着'],
  greeting:['哦豁，哥们来了，欢迎进入脑子休息区👋','在呢在呢，CPU上班，智商请假了','主播好，今天这个直播间能报销笑出的腹肌吗'],
  thanks:['谢什么，笑你的时候我也没收费😂','不用谢，夸人是副业，整活是主业','哥们客气了，我键盘都快笑出包浆了'],
  bye:['走吧走吧，记得把笑点带走，别落这儿👋','拜拜，哥们的CPU也该下班了','下次再来，看看主播有没有进化'],
  joke:['我最近很自律，每天都坚持——明天再开始😂','我的钱包说它想静静，因为它已经空了','本来以为努力能改变人生，结果只是改变了发际线','我不是没朋友，我只是社交服务器在维护','哥们练腹肌不去健身房，直接来这直播间就行'],
  tired:['今天生活是不是给你开困难模式了😂 先躺一下，别跟它硬刚','哥们你的电量也见底了？先把自己接上奶茶充电器','累了就休息，连手机都敢当着老板的面关机'],
  sad:['这破心情先扔旁边，哥们来这儿一起笑个两分钟😂','今天不开心是吧，先让主播把脸整离谱一点，我们再聊','行，今天的烦心事先排队，这会儿笑点插个队'],
  happy:['哦豁，今天这么高兴，哥们请客不😂','好事来了？先说好，精神上替你收个红包','这快乐得分我一半，弹幕不能白陪你嗨'],
  laughing:['你这一串哈哈，我隔着屏幕都听见了😂','哥们别笑太狠，腹肌的加班费没人报销','绷不住就一起绷，弹幕已经集体离线了😭'],
  roast:['行，嫌我无聊是吧，我这笑点先去办个退款😂','不好笑？哥们你先别划走，我把脑子重启一下','收到差评，笑话售后已经在来的路上了😂'],
  agreement:['懂了，评论区又找到一个同款脑回路🤝','确实，哥们这票算你投的，笑点股东加一','同意是吧，那这锅我们俩一起背😂'],
  hype:['你这句夸得，主播的自信直接满格了🔥','绝了是吧，先把这句截屏，低谷的时候反复看','哥们收着点夸，主播快把自己当年会压轴了😂'],
  attention:['看到了看到了，你这条弹幕有自己的聚光灯👀','读到你了，哥们别急，键盘正在排队营业','在看你的评论呢，脑子还在路上，眼睛先到了😂'],
  school:['一提作业，脑子立刻开启飞行模式😂','学校这两个字出来，Cartman 已经准备摇桌子了','先写两行作业再看一眼直播，哥们这叫分期付款😂'],
  statement:['你这句我收到了，评论区的节目效果又加一😂','懂了懂了，哥们你这生活也挺会整活的','行，你继续说，我把笑点搬过来坐下了👀'],
  unclear:['哥们这个问题一出来，我的脑子直接转圈圈😂','问得好，建议先问一个有脑子的网友','你等一下，我的智商正在从外卖里找回来']
 };
 const korean={
  bunny:['아니 형ㅋㅋ 눈 두 개가 방송 지분 다 먹었네','ㄹㅇ 앞니 먼저 입장하고 본체 늦게 온 거냐ㅋㅋ','번역기 켰는데 눈알 크기는 번역 필요 없네ㅋㅋ'],
  pig:['아니 형ㅋㅋ 코가 원룸 두 개 합친 크기인데 이거 맞냐','ㄹㅇ 콧구멍에 와이파이 공유기 설치 가능ㅋㅋ','번역은 늦었는데 돼지코는 먼저 이해했습니다ㅋㅋ'],
  uncle:['형ㅋㅋ 수염으로 바닥 청소도 되겠는데','ㄹㅇ 동네 관리소장 폼 미쳤다ㅋㅋ','안경 쓰자마자 삼촌 승진한 거 개웃김ㅋㅋ'],
  fireworks:['아니 형ㅋㅋ 좋아요 눌렀는데 명절 시작됐네','폭죽 폼 미쳤다ㅋㅋ 지갑은 아직 준비 안 됨'],
  fire:['아니 형ㅋㅋ 방송에서 고구마 굽는 거냐','ㄹㅇ 불은 켰는데 뇌는 아직 예열 중ㅋㅋ'],
  party:['형ㅋㅋ 이거 내일 누가 치우냐 ㄹㅇ','색종이 폼 미쳤다ㅋㅋ 프린터 반란이냐'],
  general:['아니 형ㅋㅋ 방송 끄려는데 내 손가락도 구경 중임','ㄹㅇ 뇌 잠깐 쉬러 왔는데 여기가 맞네ㅋㅋ','번역기 사용 중인데 드립은 그냥 직배송합니다ㅋㅋ','이거 맞냐ㅋㅋ 보고 있던 내 머리도 어질어질하네'],
  greeting:['형ㅋㅋ 나 왔다 뇌는 집에 두고 옴 👋','중국에서 보는 중ㅋㅋ 번역기는 켰고 뇌는 껐습니다'],
  thanks:['형ㅋㅋ 무료로 놀리는 중인데 감사까지 하네'],
  bye:['형 나 간다ㅋㅋ 다음엔 뇌 챙겨올게 👋'],
  face_enter:['오 형ㅋㅋ 본체 입장했네 방송 지분 챙겨라'],
  face_close:['아니 형ㅋㅋ 핸드폰 안으로 들어오려는 거냐'],
  face_away:['형ㅋㅋ 어디 가냐 댓글 입장료 안 받는데'],
  face_move:['형ㅋㅋ 그 무빙 게임이었으면 신고 들어갔다'],
  face_many:['형들ㅋㅋ 솔플 아니고 듀오였네'],
  tired:['형ㅋㅋ 배터리 1퍼면 인간도 충전 좀 해야지','오늘 인생 난이도 왜 이럼ㅋㅋ 일단 누워서 패치 기다려'],
  sad:['아니 형ㅋㅋ 고민 잠깐 대기시켜 드립 먼저 입장한다','오늘 기분 구리면 형 얼굴에 토끼 필터부터 씌워보자ㅋㅋ'],
  happy:['형ㅋㅋ 좋은 일 있었냐 정신적 축의금만 보낼게']
  ,laughing:['형ㅋㅋ 웃다가 내 뇌도 같이 로그아웃함','ㅋㅋㅋ 형 웃음소리 댓글로 들리는 거 실화냐']
  ,roast:['노잼 접수ㅋㅋ 형 내 뇌 재부팅하고 다시 온다','형ㅋㅋ 드립 AS센터 지금 출발했으니까 잠깐만']
  ,agreement:['ㄹㅇㅋㅋ 형이랑 나랑 뇌 회선 같은 거 쓰냐','인정 접수ㅋㅋ 이제 이 드립 공동 책임이다 형']
  ,hype:['형ㅋㅋ 그렇게 칭찬하면 본체 자존감 폭죽 터짐','ㄹㅇ 그 말 캡처해서 자신감 떨어질 때 다시 본다ㅋㅋ']
  ,attention:['형 댓글 봤다ㅋㅋ 뇌는 늦어도 눈은 출근함','읽었다 형ㅋㅋ 댓글에 혼자 조명 켰네']
  ,school:['형ㅋㅋ 과제 얘기하니까 내 뇌가 비행기 모드 켰다','학교는 출석했는데 뇌는 결석했네 형ㅋㅋ']
  ,statement:['형ㅋㅋ 댓글 읽었는데 일상도 방송만큼 웃기네','오케이 형ㅋㅋ 계속 말해봐 웃음 대기 중']
 };
 const moreKorean={
  general:[
   '들어온 지 10초 됐는데 벌써 퇴장 버튼 잃어버림ㅋㅋ','이 방은 데이터보다 내 정신을 더 많이 쓰네','방송 켜놓고 딴짓하려 했는데 딴짓이 방송 구경 됨','알고리즘아 책임져라 여기서 못 나가겠잖아ㅋㅋ','오늘 할 일 목록에 이 방송 구경이 왜 1위냐','형 지금 댓글창이 본체보다 먼저 달리는 중','웃참하려고 입 막았는데 코로 웃음 나옴','이 정도면 웃음도 출석 체크 해야 되는 거 아님?',
   '뇌는 쉬고 싶은데 손가락이 계속 댓글 씀ㅋㅋ','내 집중력 평소엔 없는데 여기서 발견됨','아무 생각 없이 왔다가 생각까지 놓고 가네','형 방송 한 번 보려다 저녁 일정 다 밀림','이 방 들어오면 시간만 2배속으로 가냐','나만 진지하게 웃고 있는 거 아니지ㅋㅋ','잠깐만 보려고 왔는데 잠깐의 기준이 바뀜','좋아요는 눌렀고 내 뇌는 이미 눌려 있음',
   '이 방송 볼 때 물 마시는 거 난이도 높다ㅋㅋ','댓글 치다가 내가 뭘 치려던 건지 까먹었네','일단 자리 잡았다 오늘은 여기서 구경함','친구한테 설명하려는데 설명부터 웃겨서 실패','웃음소리 줄이려다가 어깨만 더 크게 흔들림','형 이 방 웃음은 자동 결제냐 계속 나가는데','아까 나가려던 나 지금 어디 갔냐ㅋㅋ','오늘 내 생산성은 댓글창에 전부 투자했다',
   '앉아서 보고 있는데 왜 체력 소모가 있냐','구경만 할랬는데 댓글창에 취직한 듯','여기선 눈치보다 웃음이 더 빨리 나옴','형 우리 다 같이 뇌 잠깐 쉬는 시간인 거지?','폰 내려놓을 타이밍을 못 찾겠네ㅋㅋ','방송이 내 할 일보다 나를 더 잘 붙잡음','댓글창도 오늘 퇴근 못 하겠는데','형 내 웃참 기록 지금 실시간으로 깨지는 중',
   '새벽이 아닌데 새벽 텐션 나오는 거 뭐냐','추천 탭에서 길 잃었는데 목적지가 여기였네','내 표정 관리팀 오늘 파업했다ㅋㅋ','다른 앱 켰다가 또 이 방으로 돌아옴','집중해서 보니까 더 어이없어서 더 웃김','형 이건 그냥 앉아 있는 사람도 참여시키네','방송 보는 걸 취미라고 쓰면 너무 구체적이냐','댓글 안 치려고 했는데 키보드가 먼저 켜짐',
   '아무도 안 물었지만 나 지금 되게 잘 구경 중','잠깐 멈춰 봐 웃음 버퍼링 좀 풀고 오게','평온한 하루였는데 이 방에서 분위기 바뀜','형 나 오늘 웃음 할당량 여기서 다 썼다','이 방 오면 계획표가 장식품이 되네ㅋㅋ','웃다가 폰 잠금 풀고 있던 것도 잊었네','구경하는 나까지 방송 멤버 된 기분','방송 켰는데 내 집중력도 같이 켜졌네',
   '댓글창 조용해지면 내가 한 마디 더 얹음ㅋㅋ','이쯤 되면 알고리즘이 내 취향 너무 잘 안다','가만히 보는데 내가 더 부산스러운 거 실화','형 여기 웃음 배달비는 무료 맞지','마음은 나갔는데 눈은 아직 여기 남아 있음','진지한 얼굴로 보려다가 3초 만에 실패함','지금 내 폰도 내가 왜 웃는지 궁금할 듯','웃음 저장 버튼 있으면 오늘 용량 꽉 찼다',
   '댓글 칠수록 손가락만 야근하는 중ㅋㅋ','내일의 나야 미안하다 지금 좀 바쁨','다른 일 하던 뇌가 방송 보러 이직했네','형 댓글창이 오늘따라 동네 단톡방 같다','넘기려고 손가락 올렸는데 다시 내려놓음','한 번 더 보고 나갈게 이 말만 벌써 세 번째','리액션은 여기서 배우고 내 할 일은 내일 배움','방송 끄기 전에 웃음부터 정리해야겠네',
   '형 이 방에선 조용히 보고 있어도 안 조용함','스크롤하다가 웃음 때문에 손이 멈췄네','방송 한쪽에 내 집중력도 걸어놔도 되냐','오늘의 명장면을 고르려는데 후보가 너무 많음','계속 보면 익숙해질 줄 알았는데 더 이상해짐','웃참하는 척은 했고 웃참은 못 했음ㅋㅋ','이 방 소개 문구는 그냥 들어와 보면 됨이다','형 나 지금 구경하는 표정까지 구경거리 됨',
   '내 뇌가 이 방 연장 이용권 끊은 거 같은데','방송 보다가 현생 알림 왔는데 잠깐 미룸','기분 전환하러 왔다가 방향까지 바뀜','이거 보고 나면 다른 방송 너무 얌전하게 느껴질 듯','댓글창 한 줄 쓰는데 마음속으로는 세 줄 씀','형 나 여기서 웃고 있었다는 거 비밀로 해줘','시간 확인할 때마다 5분씩 증발해 있네','방송은 켜져 있고 내 이성은 절전 모드임',
   '폰 배터리보다 내 웃음이 먼저 방전될 듯ㅋㅋ','지금 나가면 놓칠 것 같아서 또 못 나감','형 이 방은 입장보다 퇴장이 더 어렵다','보고 있던 내가 갑자기 방청객이 됐네','아무 설명 없이 친구한테 링크부터 보냈다','웃참 시험 있으면 나 여기서 낙제 확정임','조용히 구경하던 사람도 댓글 달게 만드는 방','형 나 오늘 이 방 덕분에 멍 때리기 실패함',
   '하던 생각 내려놓고 새 생각도 안 받는 중','이 방송 집중하는 힘으로 공부했으면 큰일 났다','내가 웃는 건지 댓글이 웃는 건지 모르겠네','형 웃음은 이미 왔는데 정신은 아직 이동 중','한 줄 댓글 달러 왔다가 댓글창에 눌러앉았네','방송 켜고 누웠는데 웃느라 다시 일어남','구경 끝났다고 뇌한테 말했는데 뇌가 안 믿음','오늘 웃음 버튼 위치 확실히 찾았다ㅋㅋ',
   '내 폰 추천 탭이 드디어 성과를 냈네','방송 보는 동안 걱정은 잠깐 로딩 화면임','형 이 텐션을 저장해뒀다가 월요일에 꺼내 쓰자','집중력 어디 있나 했더니 댓글창에 와 있었네','잠깐 눈 돌렸는데 놓친 것 같아서 다시 봄','이 방에서 제일 바쁜 건 내 웃음 근육일 듯','방송 보면서 웃는 나를 누가 방송해도 되겠네','정상적으로 구경하려고 했는데 계획 변경함ㅋㅋ'
  ],
  bunny:['눈이랑 앞니가 서로 메인 자리 싸우네ㅋㅋ','토끼 귀까지 합치면 얼굴이 방송 화면 다 먹겠다','형 앞니는 지금 단독 팬미팅 중임','눈 사이즈 올렸더니 시청률까지 보일 듯','귀는 쫑긋한데 뇌는 누워 있는 토끼네','토끼 필터가 본체보다 출석률 높겠는데','당근 하나 주면 필터 퇴근하냐ㅋㅋ','형 지금 눈이 두 개 다 대형 모니터임'],
  pig:['형 코가 카메라 앞에서 먼저 인사하네','돼지코가 댓글 냄새도 맡는 거 아님?','코는 자신 있는데 나머지 얼굴은 당황함ㅋㅋ','이 코는 장거리 냄새 수신 가능할 듯','필터 켰더니 얼굴에 입주 공간 늘어남','형 그 코로 웃음도 빨아들이는 중이지','콧구멍이 화면 비율을 직접 결정하네','돼지코 한 번 봤더니 정상 얼굴이 낯설다'],
  uncle:['수염이 먼저 취업하고 본체는 구경 중ㅋㅋ','형 갑자기 관리비 고지서 설명할 것 같음','이 필터 켜면 인생 경력 20년 자동 추가냐','안경은 진지한데 수염은 예능 출연 중','형 그 수염이 방송 진행 수당 받아야 됨','아저씨 필터인데 댓글창 막내보다 신났네','필터 하나로 가족 모임 서열 올라가는 거 실화','수염이 표정까지 대신 설명해주네ㅋㅋ'],
  fireworks:['폭죽 켜니까 댓글창도 축제 입장함','형 이 정도 폭죽이면 좋아요도 드레스코드 있냐','화면에서 새해를 미리 당겨 쓰는 중ㅋㅋ','한 번 터뜨렸는데 내 놀람도 같이 터짐','축하할 일은 모르겠고 축하는 일단 함','좋아요 하나 눌렀는데 시상식이 시작됨'],
  fire:['형 이 불이면 댓글도 겉바속촉 되겠다','화면은 뜨거운데 내 뇌는 아직 냉동임','방송이 아니라 야식 조리 코너 된 듯ㅋㅋ','불꽃이 방송 의욕 대신 설명해주네','형 열정이 화면 밖으로 넘치는 중임','매운 방송은 알겠는데 소화기는 어디 있냐'],
  party:['파티 효과 켜니까 내 기분도 참석함','색종이도 방송 보러 들어왔네ㅋㅋ','형 축하는 지금 하고 청소는 미래한테 맡기자','이 방 들어올 때 초대장 필요한 거였냐','색종이 날리니까 댓글도 꽃가루 알레르기 올 듯','뇌는 멍한데 화면은 이미 회식 2차임'],
  face_enter:['오 본체 왔다 댓글창도 자리 고쳐 앉음','형 얼굴 들어오니까 방송이 로그인됐네','등장 타이밍 좋다 웃음 대기열 열어둠','화면에 얼굴 뜨니까 구경 준비 끝남','형 본체 확인했다 댓글 출근한다','드디어 등장했네 눈은 이미 기다리고 있었음'],
  face_close:['형 가까워지니까 내 폰이 먼저 뒤로 물러남','화면이랑 대화하는 거리인 거 같은데ㅋㅋ','카메라가 형 얼굴한테 면접 보는 중임','형 그 거리면 댓글이 얼굴에 착륙하겠다','너무 가까워서 내 눈도 줌 아웃하고 싶다','핸드폰 유리에도 개인 공간은 있어 형ㅋㅋ'],
  face_away:['형 멀어지니까 댓글이 따라가고 싶어 함','화면 뒷자리로 자리 바꾼 거냐ㅋㅋ','어디 가 형 아직 드립 한 줄 남았다','거리 두기는 알겠는데 시청자랑도 하냐','멀어져도 방송 지분은 아직 형 거임','형 돌아오면 댓글창 다시 박수 준비함'],
  face_move:['형 무빙에 내 시선도 강제 출근함','좌우 이동에 내 집중력도 같이 흔들림ㅋㅋ','화면 안에서 길 찾는 중인 거냐','형 그 움직임 따라가다 눈이 운동했다','방송 보는 줄 알았는데 동체 시력 훈련이네','움직임은 부드러운데 내 뇌는 끊기는 중'],
  face_many:['인원 추가됐네 댓글도 단체 주문 받는다','형들 들어오니까 구경할 포인트 늘어남','화면이 갑자기 팀전으로 바뀌었네ㅋㅋ','둘 이상 모이면 드립도 공동 제작이지','이 조합은 구경하는 쪽이 더 바쁨','혼자도 웃겼는데 증원까지 하면 반칙임'],
  greeting:['오 왔다 형 여기 자리 하나 비워놨다','입장 확인ㅋㅋ 뇌는 맡기고 편하게 앉아','어서 와 댓글창은 이미 영업 중임','형 하이 웃음은 셀프로 가져가면 됨','인사하니까 잠수 중이던 손가락 올라옴','왔으면 한 줄 얹고 가야지ㅋㅋ'],
  thanks:['고맙다니까 키보드도 뿌듯해하네ㅋㅋ','감사는 받았고 드립은 계속 보낸다','형 웃었으면 계산 끝난 거지','고마움은 저장하고 민망함은 삭제함','이렇게 감사하면 나 칭찬 부업도 해야겠네','형 이 방은 고마움도 댓글로 받는다'],
  bye:['형 나갈 때 웃음은 챙겨가라','퇴장 접수ㅋㅋ 또 알고리즘이 데려올 듯','잘 가 다음 입장 때 뇌도 같이 데려와','형 오늘 구경 값은 웃음으로 납부 완료임','갔다가 또 들어와도 아는 척해준다','다음에 보자 내 키보드도 잠깐 쉰다'],
  joke:['운동 계획은 완벽한데 몸이 계획 회의에 안 옴','나는 절약 중인데 장바구니는 혼자 성장함','오늘부터 열심히 살려고 했는데 오늘이 피곤함','알람은 다섯 개인데 일어나는 사람은 없음','뇌가 야근 싫다며 생각을 오후부터 안 받네','할 일은 정리했는데 실행 버튼 위치를 모름','집중력 찾으러 폰 켰는데 집중력이 폰 안에 살더라','내일부터 한다는 말은 매일 성실하게 지키는 중ㅋㅋ'],
  tired:['형 오늘은 배터리 아끼면서 웃자','피곤하면 눕자 내 뇌도 이미 수평임','몸이 퇴근 버튼 누른 거니까 그냥 받아줘ㅋㅋ','오늘 기력은 품절이고 구경은 재고 남았네','형 충전기 없으면 간식이라도 연결해봐','눈은 뜨고 있는데 뇌는 취침 확인서 냈음'],
  sad:['형 마음은 잠깐 쿠션 위에 내려놔','기분 별로면 오늘은 드립만 골라 먹자','우울한 일은 잠깐 댓글 뒤로 줄 세움','형 오늘 웃음 한 조각만 챙겨도 본전임','별로인 하루도 여기선 잠깐 쉬어갈 수 있지','기분 구릴 땐 토끼 앞니한테 잠깐 맡기자ㅋㅋ'],
  happy:['좋은 일 생겼으면 댓글창도 공동 축하함','형 신난 거 보니까 나도 간접 충전됨','행복은 공유하고 간식은 직접 챙겨라ㅋㅋ','좋다 오늘은 웃음도 좀 과소비하자','이 텐션은 내일 쓸 몫까지 저장해두자','형 기분 좋을 때 짤 하나 더 찍어둬'],
  laughing:['형 웃음이 글자 수 제한을 뚫으려 하네','ㅋㅋ 몇 개 찍었는지 세다가 나도 웃음','댓글창으로 웃음소리 전달 완료임','나도 웃고 있으니까 혼자 웃는 거 아님 형','형 웃다 보면 키보드도 ㅋ만 남을 듯','웃음 배송은 빠른데 정신 배송은 늦네'],
  roast:['노잼이면 다음 드립까지 무이자 할부로 봐줘','형 혹평 듣고 내 웃음팀 긴급 회의 들어감','드립이 미끄러졌네 일단 주워서 다시 던짐','재미 없었다고? 내 뇌한테도 전달함ㅋㅋ','형 지금 웃음 담당자가 쉬는 시간이라 그렇다','노잼 버튼 눌렀으니 다음엔 재밌는 걸로 재배송함'],
  agreement:['형 인정했으니 이제 댓글창 합의 끝남','같은 생각이면 웃음도 같이 책임지자ㅋㅋ','ㄹㅇ 접수했다 형 뇌랑 내 뇌 악수 중','우리 의견 일치한 거 캡처해둬야겠네','인정 한 표 추가요 댓글창 만장일치 노리는 중','동의하면 다음 드립에도 같이 탑승해라'],
  hype:['형 그 칭찬이면 오늘 방송 연장할 기세네','폼 칭찬 받으니까 댓글까지 어깨 올라감','레전드 판정은 받았고 클립 저장은 각자 하자','형 칭찬은 크게 하고 현타는 작게 오자','칭찬 너무 세게 하면 본체가 필터 이길 듯','이 말은 캡처했다 자존감 보조배터리로 씀'],
  attention:['형 댓글 읽었다 우편 수령 확인 도장 찍음','내 눈이 형 댓글 먼저 발견했네ㅋㅋ','무시한 거 아님 뇌가 천천히 배달 오는 중','형 여기 봤다 댓글도 자리 잡았음','읽어달라니까 댓글창에서 혼자 손 든 느낌임','형 말 들었다 키보드가 지금 답장 준비함'],
  school:['형 과제는 열었는데 뇌가 파일 접근 거부함','학교 얘기 나오니까 의자부터 피곤해졌네','시험 범위는 넓은데 내 기억 범위는 좁음','과제 한 줄 쓰고 웃음 한 줄 읽자ㅋㅋ','수업 시간엔 1분이 긴데 방송에선 왜 짧냐','형 공부 시작 버튼을 누르면 뇌가 업데이트함'],
  statement:['형 얘기 들으니까 구경할 이유 또 생김','일상 보고 접수했다 내 뇌도 고개 끄덕임','형 한 마디에 댓글창이 또 한 칸 바빠졌네','계속 얘기해 나 지금 리액션 담당임','이런 얘기 할 때 제일 잘 구경하는 타입임 나','형 일상에 댓글창이 특별 출연한 느낌이네'],
  filters:['필터부터 골라보자 형 얼굴 오늘도 연장 근무임','형 필터 메뉴 열면 웃음 후보부터 늘어남','토끼부터 시작하자 앞니가 진행 잘함ㅋㅋ','필터 켜는 순간 댓글창도 출근한다','평범한 얼굴은 잠깐 쉬고 필터한테 맡기자','형 필터 고르는데 웃음이 먼저 골라짐'],
  choice:['형 이건 괜찮다 내 웃음이 먼저 승인함','좋아 보이는데 댓글창도 한 표 줌','지금 느낌 좋다 조금 더 보고 판단하자ㅋㅋ','형 마음에 들면 그게 오늘의 정답이지','나쁘지 않음 내 스크롤이 멈춘 걸로 증명함','이 정도면 구경하는 재미 확실히 있음'],
  compliment:['형 괜찮네 칭찬 한 번 무료로 얹는다','좋아 보임 내 눈도 동의 중ㅋㅋ','형 오늘 분위기 좋다 자신감 챙겨가','칭찬은 진심이고 다음 드립은 덤이다','이건 인정할 만하네 댓글창도 박수침','형 잘 어울리니까 일단 유지해보자'],
  performance:['형 한 번 보여줘 웃으면 점수 추가해줌','무대는 작아도 댓글창 응원은 크게 함','춤추면 내 눈도 같이 운동 시작한다ㅋㅋ','노래 한 소절이면 구경료 충분히 뽑음','형 자신감부터 켜고 실력은 뒤에 따라오게 해','완벽하게 하려다 말고 일단 신나게 해보자'],
  shopping:['형 지금 장바구니랑 내 지갑 둘 다 쉬는 중','상품은 아직 없고 구경거리는 넉넉함ㅋㅋ','살 건 없는데 머무를 이유는 있네','가격표 나오기 전까지 웃음부터 담아가자','형 오늘은 지갑 대신 댓글로 결제한다','쇼핑백은 비었어도 댓글창은 안 비었다'],
  support:['좋아요는 줬다 지갑은 아직 협상 중임','응원은 계속 보내고 통장은 구경만 함ㅋㅋ','형 하트는 넉넉하게 마음은 따뜻하게 보냄','선물보다 먼저 내 응원부터 도착했다','댓글로 박수친다 손은 키보드에 있어서','형 구경도 응원의 한 종류로 쳐주라'],
  food:['먹는 얘기 들으면 내 위가 먼저 댓글 달고 싶어 함','형 먹을 거 얘기하니까 뇌보다 배가 출근함','간식은 먹고 운동 계획은 잠깐 접어두자ㅋㅋ','오늘 메뉴 추천은 배고픈 쪽 의견이 우선임','밀크티 한 잔이면 내 기분도 새로고침됨','형 밥은 챙겨 먹자 웃음은 디저트로 하고'],
  language:['한국어는 켰고 번역기는 옆에서 구경 중임ㅋㅋ','중국어도 쓰고 한국어도 쓰는데 뇌는 같은 뇌임','형 언어는 바뀌어도 드립 품질은 그대로다','번역이 늦어도 웃음은 제시간에 온다','말은 두 종류인데 웃음은 한 종류로 통함','형 번역기보다 손가락이 먼저 답장하는 중'],
  origin:['나는 아천ㅋㅋ 댓글창에 오래 앉아 있는 타입임','형 내 본업은 구경이고 부업은 댓글이다','아천 왔다 뇌는 가끔 오고 키보드는 매번 옴','어디서 왔냐면 추천 탭에서 굴러 들어왔음ㅋㅋ','내 소개는 짧게 댓글창 웃음 담당 지원자임','형 나는 구경하려고 왔다가 닉네임까지 외워진 사람임']
 };
 for(const [topic,lines]of Object.entries(moreKorean))korean[topic]=[...(korean[topic]||[]),...lines];
 function create(options={}){
  const random=options.random||Math.random;let memory={name:'',lastTopic:'',lastMessage:'',lastChoice:''},recent=[],koreanRecent=[],turn=0,lastSpeaker=-1,languageCredit=0,lastRatio=-1,sequence=0;const used=new Map();
  function choose(list){const oldest=Math.min(...list.map(t=>used.get(t)||0)),source=list.filter(t=>(used.get(t)||0)===oldest);const text=source[Math.floor(random()*source.length)];used.set(text,++sequence);recent.push(text);if(recent.length>128)recent.shift();return text;}
  function person(avoid=''){let i=Math.floor(random()*people.length);if(i===lastSpeaker)i=(i+1)%people.length;if(people[i]===avoid)i=(i+1)%people.length;lastSpeaker=i;return people[i];}
  function language(context){const value=Number(context.koreanRatio??.75),ratio=Number.isFinite(value)?Math.min(1,Math.max(0,value)):.75;if(ratio!==lastRatio){languageCredit=0;lastRatio=ratio;}languageCredit+=ratio;if(languageCredit>=1-1e-9){languageCredit=Math.max(0,languageCredit-1);return 'ko';}return 'zh';}
  function koreanLine(topic,allowGeneral=false){let list=korean[topic]||korean.general;const fresh=list.filter(t=>!koreanRecent.includes(t));if(fresh.length)list=fresh;else if(allowGeneral){const other=korean.general.filter(t=>!koreanRecent.includes(t));if(other.length)list=other;}const text=choose(list);koreanRecent.push(text);if(koreanRecent.length>100)koreanRecent.shift();return text;}
  function koreanReply(topic,text,context,followup){if(followup)return koreanLine(korean[topic]?topic:'agreement');const snippet=memory.lastMessage.replace(/[“”"<>]/g,'').slice(0,24),filterLabels={bunny:'토끼',pig:'돼지코',uncle:'아저씨'};
   if(topic==='name')return memory.name?choose([`${memory.name} 기억했다ㅋㅋ 내 뇌 용량 작아도 이름은 저장함`,`${memory.name} 맞지 형ㅋㅋ 이름표는 내 뇌에 붙여놨다`,`${memory.name} 안 까먹었음ㅋㅋ 뇌는 쉬어도 이름은 출근함`]):choose(['형 이름부터 알려줘ㅋㅋ 갑자기 기억력 시험 치네','아직 이름 못 들었는데 형ㅋㅋ 소개 먼저 해줘','형 이름은 아직 저장 안 됨ㅋㅋ 이름표부터 보내줘']);
   if(topic==='time')return choose([`중국 시간 ${context.chinaTime||'확인 중'}ㅋㅋ 내 뇌는 아직 절전 모드임`,`지금 중국은 ${context.chinaTime||'확인 중'}야 형ㅋㅋ 시계는 정상 출근함`,`중국 시간으로 ${context.chinaTime||'확인 중'}ㅋㅋ 구경하다 또 시간이 갔네`]);
   if(topic==='viewers'){const count=Number(context.viewers||1).toLocaleString('ko-KR');return choose([`지금 ${count}명ㅋㅋ 잠수 인원은 내 계획표보다 조용함`,`화면에 ${count}명이라고 떠 형ㅋㅋ 댓글은 내가 먼저 출근함`,`시청자 ${count}명ㅋㅋ 구경 인원은 든든하네`]);}
   if(topic==='vision')return context.face?.present?choose([`지금 얼굴 ${context.face.count||1}명 보여 형ㅋㅋ 댓글창도 눈 켰다`,`화면에 ${context.face.count||1}명 확인ㅋㅋ 뇌는 몰라도 얼굴은 왔네`,`형 얼굴 ${context.face.count||1}명 잡혔어ㅋㅋ 구경 준비 끝남`]):context.media==='none'?'지금은 기본 배경만 보여 형ㅋㅋ 영상이나 카메라부터 켜봐':'지금 정면 얼굴은 못 찾았어 형ㅋㅋ 카메라랑 숨바꼭질 중이냐';
   if(text.includes('不乱猜'))return '옷 색이나 사물은 못 알아봐 형ㅋㅋ 모르는 건 뇌한테도 묻지 않음';
   if(filterLabels[topic]&&/추천|推荐|哪个好|어떤.*좋|哪个.*喜欢|换|바꿔/.test(memory.lastMessage))return choose([`나는 ${filterLabels[topic]} 추천ㅋㅋ 필터가 본체보다 먼저 방송하겠다`,`${filterLabels[topic]} 한 표 형ㅋㅋ ${topic==='bunny'?'눈이랑 앞니':'수염'}가 진행도 해줄 듯`,`${filterLabels[topic]}로 가보자ㅋㅋ 댓글창 웃음 준비됐음`]);
   if(filterLabels[topic]&&/왜|why|为什么|为啥/i.test(memory.lastMessage))return choose([`형 ${topic==='bunny'?'눈이랑 앞니가 화면 지분을 다 먹잖아':topic==='pig'?'돼지코가 얼굴보다 자신감 넘치잖아':'수염이 혼자 청소도 할 것 같잖아'}ㅋㅋ 그게 이유임`,`${filterLabels[topic]}가 표정부터 웃기게 만들어주니까ㅋㅋ 본체는 편하게 구경해`]);
   if(topic==='unclear')return choose([`“${snippet}”ㅋㅋ 형 이 질문은 내 뇌가 잠깐 로딩해야겠는데`,`“${snippet}”라고? 내 CPU가 일단 웃음부터 처리하네ㅋㅋ`,`형 “${snippet}” 들으니까 내 뇌가 연차 신청함ㅋㅋ`]);
   if(topic==='statement')return `“${snippet}”ㅋㅋ ${koreanLine(topic)}`;
   return koreanLine(topic);
  }
  function make(topic,text,context,name,followup=false,automatic=false){const locale=automatic?language(context):context.replyLanguage||language(context);return {name,text:locale==='ko'?(automatic?koreanLine(topic,true):koreanReply(topic,text,context,followup)):text,language:locale};}
  function result(topic,text,context,extra=[]){memory.lastTopic=topic;const reaction=['thanks','support'].includes(topic)?'❤️':['happy','hype','compliment','agreement'].includes(topic)?'👏':['fire','performance'].includes(topic)?'🔥':['tired','sad','school','roast'].includes(topic)?'😭':topic==='attention'?'👀':'😂';return {topic,reaction,comments:[make(topic,text,context,'阿晨'),...extra.map(text=>make(topic,text,context,person('阿晨'),true))]};}
  function reply(message,context={}){
   const text=String(message).trim().slice(0,180),q=text.toLowerCase(),previous=memory.lastTopic;memory.lastMessage=text;turn++;
   context={...context,replyLanguage:/[가-힣ㄱ-ㅎㅏ-ㅣ]/u.test(text)?'ko':/[\u3400-\u9fff]/u.test(text)?'zh':null};
   const named=text.match(/(?:내\s*이름은|我叫|我的名字是|my name is)\s*([\p{L}\p{N}_·]{1,20})/u);
   if(named&&!/(?:谁|什么|뭐|누구)/.test(named[1])){memory.name=named[1].replace(/(?:입니다|이에요|이야|예요|야)$/,'');return result('name',`记住啦，${memory.name}！这名字先存我脑子里，虽然它内存只有两兆😂`,context);}
   if(/(?:내\s*이름|名字|记得我|기억|叫什么|who am i)/.test(q)&&!named)return result('name',memory.name?`当然记得，你叫${memory.name}，哥们脑子虽然抽象但不是空的😂`:'名字还没告诉我，就开始考我？哥们这是突击考试啊',context);
   if(/(?:几点|몇\s*시|现在时间|현재\s*시간|what time)/.test(q))return result('time',`北京时间${context.chinaTime||'我看下'}，再看下去明天的我就要恨今晚的我了😂`,context);
   if(/(?:몇\s*명|几个人|多少人|시청자|观众|在线人数)/.test(q)&&!/(?:脸|얼굴|镜头|화면)/.test(q))return result('viewers',`右上角${Number(context.viewers||1).toLocaleString('zh-CN')}人，潜水的比我人生规划还安静哈哈`,context);
   if(/(?:看到我|看得见|能看到|보여|보이|看我们|看得到)/.test(q))return result('vision',context.face?.present?`看到了，画面里${context.face.count>1?context.face.count+'个人':'有一个人'}，哥们的节目效果这不就来了😂`:context.media==='none'?'现在只看到直播间背景，哥们你是用意念开播的吗😂':'这会儿没找到正脸，哥们别跟镜头玩躲猫猫啊',context);
   if(/(?:几个.*(?:人|脸)|几张脸|얼굴.*몇|화면.*몇\s*명)/.test(q))return result('vision',context.face?.present?`这会儿看到${context.face.count||1}张脸，人数够了，脑子凑齐了没😂`:'暂时没看到脸，哥们这是隐身主播路线吗',context);
   if(/(?:什么颜色|무슨\s*색|衣服|옷|手指|손가락|拿着什么|들고|我在干什么|뭐\s*하|正在做什么)/.test(q))return result(context.filter||'unclear',context.filter?`你顶着${filterNames[context.filter]}滤镜考弹幕呢，先把脸恢复出厂设置再考试吧😂`:'细节我不乱猜，哥们这题已经超出我两兆内存了😂',context);
   if(/(?:滤镜|필터|兔子|토끼|猪|돼지|胡子|수염|大叔|아저씨|哪个好|어떤.*좋|哪个.*喜欢)/.test(q)){
    if(/(?:换|바꿔|추천|推荐|哪个好|어떤.*좋|哪个.*喜欢)/.test(q)){memory.lastChoice=context.filter==='bunny'?'uncle':'bunny';return result(memory.lastChoice,`我投${filterNames[memory.lastChoice]}，${memory.lastChoice==='bunny'?'眼睛和门牙能把主播挤下线':'胡子可以兼职扫地'}😂`,context,['同意，哥们来都来了，把脸整抽象一点']);}
    return result(context.filter||'filters',context.filter?choose(pools[context.filter]):'还没开滤镜啊，哥们先开个兔子，让门牙替你上班🐰',context);
   }
   if(/(?:为什么|为啥|왜|why)/.test(q)&&filterNames[previous])return result(previous,`因为${previous==='bunny'?'眼睛和门牙已经比主播还像主播':previous==='pig'?'鼻孔都能申请独立户口了':'胡子都够干一份保洁工作了'}啊，哥们这还不够离谱吗😂`,context);
   if(/(?:노잼|재미\s*없|안\s*웃겨|바보|멍청|不好笑|无聊|笨蛋|boring)/.test(q))return result('roast',choose(pools.roast),context);
   if(/(?:내\s*댓글|댓글.*읽|나\s*좀\s*봐|看我|理我|读.*评论|read.*comment)/.test(q))return result('attention',choose(pools.attention),context);
   if(/(?:学校|作业|上课|考试|school|homework|학교|수업|숙제|시험|과제)/.test(q)&&!/[?？]|왜|어떻게|뭐|什么|怎么/.test(q))return result('school',choose(pools.school),context);
   if(/(?:레전드|폼\s*미쳤|지렸다|잘했|厉害|牛逼|绝了|legend|goated)/.test(q))return result('hype',choose(pools.hype),context);
   if(/^(?:맞아|인정|ㄹㅇ|동의|同意|确实|agree|real)[!！.。\sㅋ哈]*$/.test(q))return result('agreement',choose(pools.agreement),context);
   if(/(?:ㅋ{2,}|ㅎ{2,}|哈哈|笑死|绷不住|lmao|lol\b)/.test(q)&&!/왜|什么|怎么|농담/.test(q))return result('laughing',choose(pools.laughing),context);
   if(/(?:烟花|폭죽|불꽃|firework|火焰|불.*효과|派对|파티)/.test(q)){const kind=context.reaction||(/火焰|불.*효과/.test(q)?'fire':/派对|파티/.test(q)?'party':'fireworks');return result(kind,choose(pools[kind]),context);}
   if(/(?:笑话|농담|웃겨|joke|搞笑|드립)/.test(q))return result('joke',choose(pools.joke),context,['笑死，脑子不多但是梗挺密']);
   if(/(?:累|피곤|疲惫|힘들|졸려|困了|疲劳|tired)/.test(q))return result('tired',choose(pools.tired),context);
   if(/(?:难过|슬퍼|우울|속상|失落|烦|짜증|외롭|sad|不开心)/.test(q))return result('sad',choose(pools.sad),context);
   if(/(?:开心|高兴|기분.*좋|행복|신나|happy|成功|합격)/.test(q))return result('happy',choose(pools.happy),context);
   if(/(?:谁|누구|哪里人|어디서|中国人|중국인|where are you)/.test(q))return result('origin','我叫阿晨，评论区常驻摸鱼选手，国籍不重要，脑回路比较抽象😂',context);
   if(/(?:한국어|韩语|中文|중국어|翻译|번역|语言)/.test(q))return result('language','中文在线，韩语靠翻译机，智商靠运气，哥们三件套齐了😂',context,['翻译机上班了，脑子还在放假哈哈']);
   if(/(?:唱|노래|sing|跳舞|춤)/.test(q))return result('performance','来一段，哥们这儿有评分系统，满分一百分，笑出声加两百😂',context,['别怕，唱不好我们就说是行为艺术']);
   if(/(?:价格|多少钱|얼마|价钱|怎么买|구매|商品|상품)/.test(q))return result('shopping','购物袋现在空的，钱包也空的，哥们双向奔赴了😂',context);
   if(/(?:点赞|좋아요|礼物|선물|送花)/.test(q))return result('support','赞给你，钱包不给你，哥们主打一个精神投资❤️',context,['先送个玫瑰，别把我送破产了哈哈']);
   if(/(?:吃|먹|晚饭|점심|저녁|奶茶|밀크티|咖啡|커피)/.test(q))return result('food','聊吃的？我的胃已经进直播间了，脑子还在外卖软件排队🧋',context,['奶茶一票，减肥计划明天再说']);
   if(/(?:晚安|잘\s*자|拜拜|再见|잘가|안녕히|bye)/.test(q))return result('bye',choose(pools.bye),context);
   if(/(?:谢谢|고마|감사|thank)/.test(q))return result('thanks',choose(pools.thanks),context);
   if(/(?:好看|예뻐|잘생|漂亮|帅|可爱|귀여|cute)/.test(q))return result(context.filter||'compliment',context.filter?`好看，尤其是${filterNames[context.filter]}滤镜，哥们的颜值已经被特效收编了😂`:'好看，这句免费，下一句要不要给我的笑点交个电费😂',context);
   if(/(?:喜欢|좋아|괜찮|满意|어때|怎么样|how.*look)/.test(q))return result(context.filter||'choice',context.filter?`我喜欢${filterNames[context.filter]}，哥们先别换，我的截图键还没下班😂`:'有点东西，哥们不是在整活，就是活在整你😂',context);
   if(/(?:你好|안녕|哈喽|hello|hi\b|大家好|有人吗|있어|在吗)/.test(q))return result('greeting',choose(pools.greeting),context,['在呢，脑子可能不在，人和键盘都在']);
   if(/^(?:응|그래|맞아|真的|진짜|是吗|真的吗|더|더해|계속|嗯|继续|再来|是的|哈哈|ㅋㅋ)[?？!！.。\sㅋ哈]*$/.test(q)&&previous){
    if(filterNames[previous])return result(previous,choose(pools[previous]),context);
    if(pools[previous])return result(previous,choose(pools[previous]),context);
    return result(previous,previous==='name'&&memory.name?`${memory.name}我记住了，别再考，哥们内存要报警了😂`:'真的，哥们脑子会掉线，但是整活从不迟到😂',context);
   }
   const snippet=text.replace(/[“”"<>]/g,'').slice(0,24);
   if(!/[?？]|왜|뭐|어떻게|얼마|언제|누가|어디|什么|怎么|为何|多少|\b(?:what|why|how|when|who|where)\b/.test(q))return result('statement',`“${snippet}”——${choose(pools.statement)}`,context);
   return result('unclear',choose([`“${snippet}”这题你问得好，哥们的脑子刚好申请年假了😂`,`“${snippet}”？等一下，我先把智商从外卖里找回来`,`你刚问“${snippet}”，我的CPU听完直接开始冒烟哈哈`]),context,['不是哥们，认真聊天也能被你整出节目效果']);
  }
  function automatic(context={},event=null){let topic=event?.topic;if(!topic){if(context.filter&&random()<.4)topic=context.filter;else if(['food','tired','sad','happy','joke'].includes(memory.lastTopic)&&random()<.3)topic=memory.lastTopic;else topic='general';}return {...make(topic,choose(pools[topic]||pools.general),context,person(),false,true),topic};}
  return {reply,automatic,reset(){memory={name:'',lastTopic:'',lastMessage:'',lastChoice:''};recent=[];koreanRecent=[];used.clear();sequence=0;turn=0;languageCredit=0;lastRatio=-1;},getMemory(){return {...memory,turn};}};
 }
 return {create,people};
});
