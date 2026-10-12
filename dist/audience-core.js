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
 };
 function create(options={}){
  const random=options.random||Math.random;let memory={name:'',lastTopic:'',lastMessage:'',lastChoice:''},recent=[],turn=0,lastSpeaker=-1;
  function choose(list){const choices=list.filter(t=>!recent.includes(t)),fallback=list.filter(t=>t!==recent.at(-1)),source=choices.length?choices:fallback.length?fallback:list;const text=source[Math.floor(random()*source.length)];recent.push(text);if(recent.length>24)recent.shift();return text;}
  function person(avoid=''){let i=Math.floor(random()*people.length);if(i===lastSpeaker)i=(i+1)%people.length;if(people[i]===avoid)i=(i+1)%people.length;lastSpeaker=i;return people[i];}
  function mix(topic,text,context){return random()<(context.koreanRatio??.12)&&korean[topic]?choose(korean[topic]):text;}
  function result(topic,text,context,extra=[]){memory.lastTopic=topic;return {topic,comments:[{name:'阿晨',text:mix(topic,text,context)},...extra.map(text=>({name:person('阿晨'),text}))]};}
  function reply(message,context={}){
   const text=String(message).trim().slice(0,180),q=text.toLowerCase(),previous=memory.lastTopic;memory.lastMessage=text;turn++;
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
   if(/(?:烟花|폭죽|불꽃|firework|火焰|불.*효과|派对|파티)/.test(q)){const kind=context.reaction||(/火焰|불.*효과/.test(q)?'fire':/派对|파티/.test(q)?'party':'fireworks');return result(kind,choose(pools[kind]),context);}
   if(/(?:笑话|농담|웃겨|joke|搞笑|드립)/.test(q))return result('joke',choose(pools.joke),context,['笑死，脑子不多但是梗挺密']);
   if(/(?:累|피곤|疲惫|힘들|졸려|困了|疲劳|tired)/.test(q))return result('tired',choose(pools.tired),context);
   if(/(?:难过|슬퍼|우울|속상|失落|烦|짜증|외롭|sad|不开心)/.test(q))return result('sad',choose(pools.sad),context);
   if(/(?:开心|高兴|기분.*좋|행복|신나|happy|成功|합격)/.test(q))return result('happy',choose(pools.happy),context);
   if(/(?:谁|누구|哪里人|어디서|中国人|중국인|where are you)/.test(q))return result('origin','我叫阿晨，评论区常驻摸鱼选手，国籍不重要，脑回路比较抽象😂',context);
   if(/(?:한국어|韩语|中文|중국어|翻译|번역|语言)/.test(q))return result('language','中文在线，韩语靠翻译机，智商靠运气，哥们三件套齐了😂',context,['중국어는 켰고 한국어는 번역기 빌렸고 뇌는 휴가 보냄ㅋㅋ']);
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
   return result('unclear',choose([`“${snippet}”这题你问得好，哥们的脑子刚好申请年假了😂`,`“${snippet}”？等一下，我先把智商从外卖里找回来`,`你刚问“${snippet}”，我的CPU听完直接开始冒烟哈哈`]),context,['不是哥们，认真聊天也能被你整出节目效果']);
  }
  function automatic(context={},event=null){let topic=event?.topic;if(!topic){if(context.filter&&random()<.65)topic=context.filter;else if(['food','tired','sad','happy','joke'].includes(memory.lastTopic)&&random()<.3){if(memory.lastTopic==='food')return {name:person(),text:'刚聊完吃的，哥们的减肥计划已经连夜注销了🧋',topic:'food'};topic=memory.lastTopic;}else topic='general';}return {name:person(),text:mix(topic,choose(pools[topic]||pools.general),context),topic};}
  return {reply,automatic,reset(){memory={name:'',lastTopic:'',lastMessage:'',lastChoice:''};recent=[];turn=0;},getMemory(){return {...memory,turn};}};
 }
 return {create,people};
});
