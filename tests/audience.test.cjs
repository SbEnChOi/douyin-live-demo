const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {create}=require('../dist/audience-core.js');
const plain={koreanRatio:0,filter:'',reaction:'',media:'none',viewers:12800};
test('remembers the introduced name, answers follow-ups, and clears memory on reset',()=>{
 const bot=create({random:()=>.5});
 assert.match(bot.reply('내 이름은 승빈이야',plain).comments[0].text,/승빈/);
 assert.match(bot.reply('내 이름 기억나?',plain).comments[0].text,/승빈/);
 assert.match(bot.reply('진짜?',plain).comments[0].text,/승빈/);
 bot.reset();assert.doesNotMatch(bot.reply('내 이름 기억나?',plain).comments[0].text,/승빈/);
});
test('a why-question follows the recommended filter rather than making a new unrelated reply',()=>{
 const bot=create({random:()=>.5});const reply=bot.reply('어떤 필터가 좋아?',{...plain,filter:'uncle'});
 assert.equal(reply.topic,'bunny');assert.match(reply.comments[0].text,/토끼/);
 const why=bot.reply('왜?',plain);assert.equal(why.topic,'bunny');assert.match(why.comments[0].text,/눈|앞니|표정/);
 assert.equal(bot.reply('더',plain).topic,'bunny');
 assert.notEqual(reply.comments[0].name,reply.comments[1].name);
});
test('Chinese-only automatic comments do not repeat adjacent lines; Korean mix has internet slang',()=>{
 const bot=create({random:()=>0});let previous='';
 for(let i=0;i<30;i++){const text=bot.automatic(plain).text;assert.notEqual(text,previous);assert.doesNotMatch(text,/[가-힣ㄱ-ㅎ]/);previous=text;}
 assert.match(bot.automatic({...plain,koreanRatio:1,filter:'bunny'}).text,/ㅋㅋ|ㄹㅇ/);
});
test('comments follow actual scene events and do not invent a face or clothing color',()=>{
 const bot=create({random:()=>.5});assert.equal(bot.automatic(plain,{topic:'fireworks'}).topic,'fireworks');
 assert.match(bot.reply('저 지금 보여?',plain).comments[0].text,/기본 배경/);
 assert.match(bot.reply('저 지금 보여?',{...plain,media:'camera',face:{present:true,count:2}}).comments[0].text,/2명/);
 assert.match(bot.reply('옷 무슨 색이야?',plain).comments[0].text,/못 알아봐/);
 assert.match(bot.reply('시청자 몇 명이야?',plain).comments[0].text,/12,800/);
});
test('unknown questions get a contextual joke and ordinary tired messages stay in joke mode',()=>{
 const bot=create({random:()=>.5});assert.match(bot.reply('양자역학 수업 시작할까?',plain).comments[0].text,/양자역학/);
 assert.equal(bot.reply('오늘 너무 피곤해',plain).topic,'tired');
 assert.match(bot.reply('농담해줘',plain).comments[0].text,/운동|몸|장바구니|피곤|알람|뇌|할 일|집중|내일/);
});

function browserLogic(withMemes=false){
 let now=0,id=0;const timers=new Map(),comments=[],reactions=[],elements=new Map(),handlers=new Map();
 const defaults={smartComments:{checked:true},replyToMe:{checked:true},autoChat:{checked:true},audienceInterval:{value:'6'},koreanMix:{value:'0'},viewers:{value:'12800'},stage:{dataset:{}},media:{currentTime:0,paused:true},audienceTyping:{hidden:true},sendMemes:{checked:true},memeFrequency:{value:'35'},swearLevel:{value:'0'}};
 const get=key=>{if(!elements.has(key))elements.set(key,{textContent:'',hidden:false,dataset:{},value:'',checked:false,classList:{add(){},remove(){}},listeners:{},addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);},...defaults[key]});return elements.get(key);};
 class FakeDate extends Date {static now(){return now;}}
 const math=Object.create(Math);math.random=()=>0;
 const sandbox={Math:math,Date:FakeDate,Intl,console,document:{hidden:false,getElementById:get,addEventListener(){}},setTimeout(callback,delay){timers.set(++id,{callback,due:now+delay});return id;},clearTimeout(key){timers.delete(key);},addComment(text,name,self,attachment,replyTo){comments.push({text,name,attachment,replyTo,at:now});},reactComment(row,emoji,name){reactions.push({row,emoji,name,at:now});},toast(){},pick:array=>array[0],custom:[],mediaKind:'none',mediaGeneration:1,chatTimer:0,scheduleChat(){},$ :get,liveEffects:{watchFaces(){}},addEventListener(type,callback){(handlers.get(type)||handlers.set(type,[]).get(type)).push(callback);}};
 sandbox.window=sandbox;const context=vm.createContext(sandbox);
 for(const filename of [...(withMemes?['meme-pack.js']:[]),'audience-core.js','audience.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',filename),'utf8'),context,{filename});
 return {context,get,comments,reactions,emit(type,detail){for(const callback of handlers.get(type)||[])callback({detail});},change(key){for(const callback of get(key).listeners.change||[])callback({target:get(key)});},advance(ms){const target=now+ms;let steps=0;while(true){let next=null;for(const [key,value]of timers)if(value.due<=target&&(!next||value.due<next[1].due))next=[key,value];if(!next)break;if(++steps>1000)throw Error('Runaway timer');timers.delete(next[0]);now=next[1].due;next[1].callback();}now=target;}};
}
test('question replies are delayed, preserve FIFO order, and work with automatic comments paused',()=>{
 const app=browserLogic();app.get('autoChat').checked=false;app.change('autoChat');
 app.context.liveAudience.ask('내 이름은 승빈');app.context.liveAudience.ask('내 이름 기억나?');
 app.advance(2199);assert.equal(app.comments.length,0);
 app.advance(1);assert.equal(app.comments.length,1);assert.match(app.comments[0].text,/승빈/);
 app.advance(2200);assert.equal(app.comments.length,2);assert.match(app.comments[1].text,/승빈/);
 app.advance(15000);assert.equal(app.comments.length,2);
});
test('turning off the feature cancels pending replies and typing; a reset clears names',()=>{
 const app=browserLogic();app.context.liveAudience.ask('안녕');app.get('smartComments').checked=false;app.change('smartComments');app.advance(10000);assert.equal(app.comments.length,0);assert.equal(app.get('audienceTyping').hidden,true);
 app.get('smartComments').checked=true;app.change('smartComments');app.context.liveAudience.ask('내 이름은 승빈');app.advance(2200);app.get('restartPreview').listeners.click[0]();app.context.liveAudience.ask('내 이름 기억나?');app.advance(2200);assert.doesNotMatch(app.comments.at(-1).text,/승빈/);
});
test('a static photo remains observed after several seconds, and a source change invalidates it',()=>{
 const app=browserLogic();app.context.mediaKind='image';app.emit('live:face',{present:true,count:2,x:.5,size:.3});app.advance(10000);app.context.liveAudience.ask('저 지금 보여?');app.advance(2200);assert.match(app.comments.at(-1).text,/2명/);
 app.context.mediaGeneration++;app.emit('live:face',{present:false,count:0,reason:'source_changed'});app.context.liveAudience.ask('저 지금 보여?');app.advance(2200);assert.match(app.comments.at(-1).text,/못 찾/);
});

test('meme requests retain delayed replies and obey settings changed while the reply is pending',()=>{
 const app=browserLogic(true);app.get('autoChat').checked=false;app.change('autoChat');
 app.context.liveAudience.ask('SON 짤 보내줘');app.advance(2199);assert.equal(app.comments.length,0);
 app.advance(1);assert.equal(app.comments[0].attachment,'son');assert.match(app.comments[0].text,/SON/);
 app.advance(1100);
 app.context.liveAudience.ask('고양이 박수 GIF 보내줘');app.get('sendMemes').checked=false;
 app.advance(2200);assert.equal(app.comments.at(-1).attachment,null);
});

test('short everyday comments get fitting reactions without being treated as factual questions',()=>{
 const bot=create({random:()=>.5});
 for(const [message,topic,emoji] of [['ㅋㅋㅋㅋ','laughing','😂'],['노잼','roast','😭'],['인정ㅋㅋ','agreement','👏'],['내 댓글 읽어줘','attention','👀'],['폼 미쳤다','hype','👏'],['과제 하기 싫다','school','😭']]){
  const answer=bot.reply(message,plain);assert.equal(answer.topic,topic);assert.equal(answer.reaction,emoji);assert.doesNotMatch(answer.comments[0].text,/这个问题|这题|你刚问/);
 }
 const ordinary=bot.reply('오늘 운동하고 왔다',plain);assert.equal(ordinary.topic,'statement');assert.match(ordinary.comments[0].text,/오늘 운동하고 왔다/);
});

test('quick emoji reactions and delayed replies stay tied to the correct original comments',()=>{
 const app=browserLogic(true),first={id:1},second={id:2};app.get('autoChat').checked=false;app.change('autoChat');
 app.context.liveAudience.ask('ㅋㅋㅋㅋ',first);app.context.liveAudience.ask('노잼',second);
 app.advance(699);assert.equal(app.reactions.length,0);assert.equal(app.comments.length,0);
 app.advance(1);assert.equal(app.reactions[0].row,first);assert.equal(app.reactions[0].emoji,'😂');assert.equal(app.reactions[1].row,second);assert.equal(app.reactions[1].emoji,'😭');
 app.advance(1500);assert.equal(app.comments[0].replyTo.text,'ㅋㅋㅋㅋ');assert.match(app.comments[0].text,/[가-힣]/);
 app.advance(2200);assert.equal(app.comments[1].replyTo.text,'노잼');assert.match(app.comments[1].text,/노잼|뇌|드립|웃음/);
});

test('disabling replies cancels emojis and queued answers while automatic comments continue',()=>{
 const app=browserLogic();app.context.liveAudience.ask('내 댓글 읽어줘',{id:1});app.get('replyToMe').checked=false;app.change('replyToMe');
 app.advance(10000);assert.equal(app.reactions.length,0);assert.ok(app.comments.length>0);assert.ok(app.comments.every(c=>!c.replyTo));assert.equal(app.get('audienceTyping').hidden,true);
 app.get('autoChat').checked=false;app.change('autoChat');app.get('replyToMe').checked=true;app.change('replyToMe');
 app.context.liveAudience.ask('인정ㅋㅋ',{id:2});app.get('restartPreview').listeners.click[0]();const before=app.comments.length;app.advance(4000);assert.equal(app.reactions.length,0);assert.equal(app.comments.length,before);
});

test('automatic comments keep a 3:1 language split even with memes and Korean conversation',()=>{
 const bot=create({random:()=>0}),memes=require('../dist/meme-pack.js').create({random:()=>0});
 let ko=0,zh=0;
 for(let i=0;i<120;i++){
  if(i%9===0)for(const reply of bot.reply('안녕',{...plain,koreanRatio:.75}).comments)assert.equal(reply.language,'ko');
  const original=bot.automatic({...plain,koreanRatio:.75});
  const styled=memes.decorate(original,{koreanRatio:.75,sendMemes:false,swearLevel:0});
  if(styled.language==='ko'){ko++;assert.match(styled.text,/[가-힣]/);}else{zh++;assert.doesNotMatch(styled.text,/[가-힣ㄱ-ㅎ]/);}
 }
 assert.equal(ko,90);assert.equal(zh,30);
});

test('automatic Korean comments avoid the recent hundred lines even with one filter left on',()=>{
 const bot=create({random:()=>0}),recent=[];
 for(let i=0;i<180;i++){
  const line=bot.automatic({...plain,koreanRatio:1,filter:'bunny'}).text;
  assert.ok(!recent.includes(line),'Recent duplicate: '+line);recent.push(line);if(recent.length>100)recent.shift();
 }
});

test('greetings, follow-ups, and facts answer in the language the user used',()=>{
 const bot=create({random:()=>0});
 for(const message of ['안녕','ㅋㅋㅋ','내 이름은 승빈','내 이름 기억나?','어떤 필터가 좋아?','왜?','내 댓글 읽어줘','한국어로 얘기하자']){
  const answer=bot.reply(message,{...plain,koreanRatio:0});
  for(const c of answer.comments){assert.equal(c.language,'ko');assert.match(c.text,/[가-힣ㄱ-ㅎ]/);}
 }
 assert.match(bot.reply('내 이름 기억나?',plain).comments[0].text,/승빈/);
 assert.match(bot.reply('시청자 몇 명이야?',plain).comments[0].text,/12,800/);
 for(const c of bot.reply('你好',{...plain,koreanRatio:1}).comments){assert.equal(c.language,'zh');assert.doesNotMatch(c.text,/[가-힣]/);}
});

test('two-second automatic mode produces a comment at the configured jittered interval',()=>{
 const app=browserLogic();app.get('audienceInterval').value='2';app.get('audienceInterval').listeners.input[0]();
 app.advance(1639);assert.equal(app.comments.length,0);app.advance(1);assert.equal(app.comments.length,1);
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
 assert.match(html,/id="audienceInterval"[^>]*min="0\.8"[^>]*value="2"/);
 assert.match(html,/id="koreanMix"[^>]*max="100"[^>]*value="75"/);
});
