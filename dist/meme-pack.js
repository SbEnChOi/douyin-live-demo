(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiveMemePack=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const catalog=Object.freeze({
  son:Object.freeze({id:'son',title:'SON 😭',src:'memes/son.jpg',kind:'image',width:2726,height:1532,strong:false,source:'https://knowyourmeme.com/memes/son-%F0%9F%98%AD%F0%9F%98%AD%F0%9F%98%AD%F0%9F%98%AD%F0%9F%98%AD-son-meme',credit:'Anthony Mackie / Son reaction meme · Know Your Meme',date:'2025–2026'}),
  crine:Object.freeze({id:'crine',title:'Our brains are crine 😭',src:'memes/son-crine.gif',kind:'image',width:498,height:394,strong:false,source:'https://tenor.com/view/son-im-crine-crine-gif-5473228463719084607',credit:'PayokCC · Tenor',date:'2026.01'}),
  clap:Object.freeze({id:'clap',title:'Black Cat Clapping',src:'memes/black-cat-clap.gif',kind:'gif',width:270,height:480,strong:false,source:'https://tenor.com/view/black-cat-black-cat-clapping-black-cat-meme-msa-mrsimplyamazing-gif-16468097652978043770',credit:'MrSimplyAmazing · Tenor / @merkurianin meme',date:'2026.09–10'}),
  rage:Object.freeze({id:'rage',title:'Cartman: sick of school',src:'memes/cartman-school.gif',kind:'gif',width:338,height:200,strong:true,source:'https://tenor.com/view/eric-cartman-south-park-school-gif-13777519',credit:'South Park · FaZe_RaVeN / Tenor',date:'2026.09 재유행'}),
  tiptoe:Object.freeze({id:'tiptoe',title:'AI Rumpelstiltskin / Tiptoe',src:'memes/tiptoe.jpg',kind:'image',width:1280,height:720,strong:false,source:'https://knowyourmeme.com/memes/ai-rumpelstiltskin-tip-toein-in-my-jordans',credit:'@stroinaya AI meme · Know Your Meme',date:'2026.09–10'}),
  fanum:Object.freeze({id:'fanum',title:'Fanum throws',src:'memes/fanum-throws.gif',kind:'gif',width:320,height:316,strong:false,source:'',credit:'Fanum · user-provided GIF',date:'2026.10'}),
  'fanum-still':Object.freeze({id:'fanum-still',title:'Fanum (still)',src:'memes/fanum-throws.jpg',kind:'image',width:320,height:316,strong:false,source:'',credit:'Fanum · user-provided still',date:'2026.10'}),
  fine:Object.freeze({id:'fine',title:'This Is Fine',src:'memes/this-is-fine.gif',kind:'gif',width:360,height:360,strong:false,source:'https://tenor.com/view/this-is-fine-gif-169627709039193285',credit:'KC Green / Tenor',date:'2026.10'}),
  pika:Object.freeze({id:'pika',title:'Surprised Pikachu',src:'memes/surprised-pikachu.gif',kind:'gif',width:360,height:360,strong:false,source:'https://tenor.com/view/surprised-pikachu-surprise-gif-24063172',credit:'Pokémon / Tenor',date:'2026.10'}),
  crycat:Object.freeze({id:'crycat',title:'Crying Cat',src:'memes/crying-cat.gif',kind:'gif',width:360,height:348,strong:false,source:'https://tenor.com/view/crying-cat-gif-10305058140793635516',credit:'Tenor',date:'2026.10'}),
  doge:Object.freeze({id:'doge',title:'Doge',src:'memes/doge.gif',kind:'gif',width:360,height:307,strong:false,source:'https://tenor.com/view/doge-alright-alright-doge-smile-doge-smirk-doge-flattered-doge-gif-11869481397394102467',credit:'Doge / Tenor',date:'2026.10'})
 });
 const lines={
  son:{zh:['SON 😭😭 哥们的脸已经开始加载新版本了','son，我刚点进来，脑子已经笑着退出了😭','SON 😭 这滤镜是打算把主播永久收编吗','son，表情包本人就在直播间是吧😭'],ko:['SON 😭 형ㅋㅋ 얼굴이 밈 원본보다 먼저 출근했네','son 😭 ㄹㅇ 본체보다 필터가 방송 잘하는데 이거 맞냐']},
  crine:{zh:["I’m crine 😭 我脑子说它先去哭一会儿",'our brains are crine 😭 这直播间到底谁在管理笑点','笑不活了😭 脑子申请离开，眼睛不同意'],ko:["I'm crine 😭 형ㅋㅋ 내 뇌도 지금 눈물 흘림",'our brains are crine 😭 번역기보다 내 웃음이 먼저 터짐ㅋㅋ']},
  clap:{zh:['这猫已经替我鼓掌了，哥们继续，别恢复正常👏','黑猫鼓掌.jpg，理智下班，节目效果上班','猫都开始鼓掌了，这活整得够抽象😂','猫：我不理解，但是我先鼓掌👏'],ko:['고양이도 박수친다 형ㅋㅋ ㄹㅇ 어이가 없는데 잘하네','아니 형ㅋㅋ 고양이가 먼저 인정해버렸네 👏']},
  rage:{zh:['这破课一提，脑子已经开始摇桌子了😂','Cartman 代表我发言，今天的耐心已售罄','上课的我 vs 看直播的我，属于两个物种😂','不是哥们，作业还没写，桌子先想离家出走'],ko:['형ㅋㅋ 학교 얘기하니까 책상부터 흔들고 싶네','ㄹㅇ 수업 시작하면 내 뇌가 자동 로그아웃함ㅋㅋ']},
  tiptoe:{zh:['哥们这个走位，Rumpelstiltskin 都得让你当领舞😂','这不是跳舞，这是脑回路偷偷溜出直播间','脚开始整活，脑子表示自己毫不知情😂','这动作属于深夜刷到就睡不着的程度'],ko:['형ㅋㅋ 이 무빙 Tiptoe 선배도 자리 양보하겠다','아니 형ㅋㅋ 발은 춤추는데 뇌는 퇴근했네']}
 };
 const tags={zh:{son:'SON 😭',crine:"I’m crine 😭",clap:'👏 黑猫都开始鼓掌了',rage:'😂 Cartman 已经开始摇桌子了',tiptoe:'😂 Tiptoe 本人来了'},ko:{son:'SON 😭',crine:"I’m crine 😭",clap:'👏 고양이도 인정함ㅋㅋ',rage:'😂 카트맨도 책상 흔드는 중',tiptoe:'😂 Tiptoe 선배 입장ㅋㅋ'}};
 function get(id){return Object.hasOwn(catalog,id)?catalog[id]:null;}
 function detect(message){const q=String(message||'').toLowerCase();if(/crine|크라인|크린/.test(q))return 'crine';if(/\bson\b|손\s*밈|son\s*😭/.test(q))return 'son';if(/black\s*cat|고양이.*박수|박수.*고양이|黑猫|猫.*鼓掌/.test(q))return 'clap';if(/tiptoe|rumpel|럼펠|티프토|팁토/.test(q))return 'tiptoe';if(/cartman|카트맨|卡特曼/.test(q))return 'rage';return null;}
 function create(options={}){
  const random=options.random||Math.random,clock=options.now||Date.now;let lastMediaAt=-Infinity,lastMediaId='',recent=[];
  function choose(array){const unused=array.filter(value=>!recent.includes(value)),fallback=array.filter(value=>value!==recent.at(-1)),source=unused.length?unused:fallback.length?fallback:array;const value=source[Math.floor(random()*source.length)];recent.push(value);if(recent.length>15)recent.shift();return value;}
  function keyFor(topic,message,context,direct){
   if(direct)return direct;
   const q=String(message||'').toLowerCase();
   if(topic==='school'||/学校|作业|上课|考试|school|homework|학교|수업|숙제|시험|과제/.test(q))return 'rage';
   if(['performance','party','face_move'].includes(topic))return 'tiptoe';
   if(['support','compliment','thanks','happy','hype','agreement','fireworks','fire','greeting','face_many'].includes(topic))return 'clap';
   if(['tired','sad','roast','laughing','unclear','shopping','food'].includes(topic))return 'crine';
   if(['bunny','pig','uncle','face_close','face_enter','face_away','filters','choice','joke'].includes(topic)||context.filter)return 'son';
   const ids=['son','crine','clap','tiptoe'].filter(id=>id!==lastMediaId);return ids[Math.floor(random()*ids.length)];
  }
  function decorate(comment,context={},meta={}){
   const protectedTopic=['name','time','viewers','vision','language'].includes(comment.topic),direct=meta.isReply&&!protectedTopic?detect(meta.message):null;
   const explicit=meta.isReply&&/(?:gif|짤|움짤|表情包|动图|图片|밈.*보내|send.*meme)/i.test(String(meta.message||''));
   let key=keyFor(comment.topic,meta.message,context,direct);
   if(key==='rage'&&Number(context.swearLevel??1)===0)key='crine';
   let text=comment.text;
   const locale=comment.language||(random()<(context.koreanRatio??.75)?'ko':'zh');
   const useMeme=!protectedTopic&&(direct||explicit||random()<.38);
   if(useMeme){if(direct||explicit)text=choose(lines[key][locale]);else text+=' '+tags[locale][key];}
   const level=Number(context.swearLevel??1),isKorean=/[가-힣ㄱ-ㅎ]/.test(text);
   if(!protectedTopic&&level>0&&random()<(level===2?.34:.16)){
    const exclamations=isKorean?(level===2?['씨발ㅋㅋ','ㅅㅂㅋㅋ','아니 시발ㅋㅋ']:['아 ㅅㅂㅋㅋ','미친ㅋㅋ','와 씨ㅋㅋ']):(level===2?['卧槽，','靠，','damn，','what the fuck，']:['卧槽，','靠，','damn，']);
    text=choose(exclamations)+(isKorean?' ':'')+text;
   }
   const force=!!meta.forceMedia||!!direct||explicit;
   const canSend=context.sendMemes!==false&&(force||(!protectedTopic&&clock()-lastMediaAt>=12000&&random()<(context.mediaRatio??.35)));
   let attachment=null;
   if(canSend){if(!force&&key===lastMediaId&&key==='son')key='crine';attachment=get(key);lastMediaAt=clock();lastMediaId=key;}
   return {...comment,text,attachment:attachment?.id||null,meme:useMeme?key:null};
  }
  return {decorate,reset(){lastMediaAt=-Infinity;lastMediaId='';recent=[];}};
 }
 return {get,create,catalog,checkedAt:'2026-10-12'};
});
