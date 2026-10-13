const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const pack=require('../dist/meme-pack.js');
const base={koreanRatio:0,sendMemes:true,mediaRatio:1,swearLevel:0};
const comment=topic=>({name:'阿晨',text:'原来的回答',topic});

test('direct requests send the requested meme even when automatic media frequency is zero',()=>{
 const memes=pack.create({random:()=>0,now:()=>0});
 for(const [message,id] of [['SON 짤 보내줘','son'],["I'm crine GIF 보내줘",'crine'],['고양이 박수 GIF 보내줘','clap'],['Tiptoe 이미지 보내줘','tiptoe']]){
  const reply=memes.decorate(comment('unclear'),{...base,mediaRatio:0},{isReply:true,message});
  assert.equal(reply.attachment,id);assert.notEqual(reply.text,'原来的回答');
 }
 assert.equal(memes.decorate(comment('joke'),{...base,sendMemes:false},{isReply:true,message:'SON 짤 보내줘',forceMedia:true}).attachment,null);
});

test('attachments fit the current subject, including school, dancing, praise, and filters',()=>{
 for(const [topic,message,id] of [['unclear','숙제 하기 싫다','rage'],['party','','tiptoe'],['compliment','','clap'],['bunny','','son'],['tired','','crine']]){
  const reply=pack.create({random:()=>.5}).decorate(comment(topic),{...base,swearLevel:1},{isReply:!!message,message});
  assert.equal(reply.attachment,id);
 }
});

test('meme seasoning keeps the actual answer, names, viewer counts, and observed scene facts',()=>{
 const memes=pack.create({random:()=>0});
 const answer={name:'阿晨',text:'我推荐兔子滤镜，因为大眼睛很搞笑',topic:'bunny'};
 assert.match(memes.decorate(answer,base,{isReply:true,message:'어떤 필터가 좋아?'}).text,/我推荐兔子滤镜，因为大眼睛很搞笑/);
 for(const topic of ['name','time','viewers','vision','language']){
  const original={...comment(topic),text:'승빈 / 12,800 / 2个人'};
  const styled=memes.decorate(original,{...base,swearLevel:2},{isReply:true,message:'질문'});
  assert.equal(styled.text,original.text);assert.equal(styled.attachment,null);
 }
});

test('no-profanity mode excludes explicit Cartman captions; stronger modes remain occasional',()=>{
 const quiet=pack.create({random:()=>0}).decorate(comment('unclear'),base,{isReply:true,message:'Cartman GIF 보내줘'});
 assert.equal(quiet.attachment,'crine');assert.doesNotMatch(quiet.text,/fuck|卧槽|씨발|ㅅㅂ|damn/i);
 const strong=pack.create({random:()=>0}).decorate(comment('joke'),{...base,koreanRatio:1,swearLevel:2},{isReply:true,message:'SON 짤 보내줘'});
 assert.match(strong.text,/씨발|ㅅㅂ|시발/);
 const ordinary=pack.create({random:()=>.9}).decorate(comment('joke'),{...base,swearLevel:2});
 assert.equal(ordinary.text,'原来的回答');
});

test('automatic images wait twelve seconds; direct requests bypass that delay and reset clears it',()=>{
 let now=0;const memes=pack.create({random:()=>.5,now:()=>now});
 assert.equal(memes.decorate(comment('party'),base).attachment,'tiptoe');
 now=11999;assert.equal(memes.decorate(comment('compliment'),base).attachment,null);
 now=12000;assert.equal(memes.decorate(comment('compliment'),base).attachment,'clap');
 now=12001;assert.equal(memes.decorate(comment('joke'),base,{isReply:true,message:'SON 짤 보내줘'}).attachment,'son');
 now=24000;assert.equal(memes.decorate(comment('party'),base).attachment,null);
 memes.reset();assert.equal(memes.decorate(comment('party'),base).attachment,'tiptoe');
});

test('Chinese-only captions vary; Korean captions retain playful internet phrasing',()=>{
 const memes=pack.create({random:()=>0});let previous='';
 for(let i=0;i<15;i++){
  const reply=memes.decorate(comment('joke'),base,{isReply:true,message:'SON 짤 보내줘'});
  assert.doesNotMatch(reply.text,/[가-힣ㄱ-ㅎ]/);assert.notEqual(reply.text,previous);previous=reply.text;
 }
 assert.match(memes.decorate(comment('joke'),{...base,koreanRatio:1},{isReply:true,message:'SON 짤 보내줘'}).text,/형ㅋㅋ|ㄹㅇ/);
});

test('every attachment points to a bundled image and arbitrary URLs cannot enter the catalog',()=>{
 assert.equal(pack.get('__proto__'),null);assert.equal(pack.get('https://evil.example/image.gif'),null);
 for(const item of Object.values(pack.catalog)){
  const bytes=fs.readFileSync(path.join(__dirname,'../dist',item.src));
  assert.ok(bytes.length>1000);assert.match(item.source,/^https:\/\//);
  assert.ok(bytes.subarray(0,3).equals(Buffer.from([255,216,255]))||/^GIF8[79]a/.test(bytes.subarray(0,6).toString()));
 }
});

test('media rendering keeps history, preserves reading position, and returns to new comments on request',()=>{
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.classes=new Set();this.textContent='';this.hidden=true;this.scrollHeight=100;this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  replaceChildren(...children){this.children=[];this.append(...children);}
  get firstElementChild(){return this.children[0];}
  remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}
  setAttribute(key,value){this[key]=value;}
  addEventListener(type,callback){this.listeners[type]=callback;}
  querySelector(selector){return this.children.find(child=>child.classes.has(selector.slice(1)))||null;}
 }
 const elements=new Map(),get=id=>elements.get(id)||elements.set(id,new Element('div')).get(id);
 const sandbox={console,Math,LiveMemePack:pack,document:{getElementById:get,createElement:tag=>new Element(tag)}};sandbox.window=sandbox;
 const context=vm.createContext(sandbox);
 const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8').split("$('mediaFile').addEventListener")[0];
 vm.runInContext(source,context);
 context.addComment('<img onerror=bad()>','阿晨',false,'clap');
 const row=get('chatFeed').children[0],button=row.children[3],img=button.children[0];
 assert.equal(row.children[2].textContent,'<img onerror=bad()>');assert.equal(img.src,'memes/black-cat-clap.gif');
 assert.equal(button.children[1].textContent,'GIF');assert.ok(get('chatArea').classes.has('has-chat-media'));
 button.listeners.click();assert.equal(get('sheet').hidden,false);assert.equal(get('sheetContent').children[2].href,pack.get('clap').source);
 img.listeners.error();assert.ok(button.classes.has('media-failed'));
 const area=get('chatArea');area.scrollHeight=1000;area.clientHeight=300;area.scrollTop=150;area.listeners.scroll();
 context.addComment('新评论','阿晨');img.listeners.load();assert.equal(area.scrollTop,150);assert.equal(get('chatLatest').hidden,false);assert.match(get('chatLatest').textContent,/1/);
 get('chatLatest').listeners.click();assert.equal(area.scrollTop,1000);assert.equal(get('chatLatest').hidden,true);
 for(let i=0;i<500;i++)context.addComment('纯文字','阿晨',false,'https://evil.example/image.gif');
 assert.equal(get('chatFeed').children.length,500);assert.ok(!get('chatArea').classes.has('has-chat-media'));
 assert.equal(get('chatFeed').children.at(-1).children.length,3);
});
