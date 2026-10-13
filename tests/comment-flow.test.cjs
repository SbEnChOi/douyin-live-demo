const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('submitting the actual chat form adds a reaction and a quoted reply to that same comment',()=>{
 class Element{
  constructor(tag,root=false){this.tagName=tag;this.root=root;this.children=[];this.listeners={};this.classes=new Set();this.className='';this.dataset={};this.value='';this.checked=false;this.textContent='';this.scrollHeight=100;this.classList={add:c=>this.classes.add(c),remove:(...cs)=>cs.forEach(c=>this.classes.delete(c)),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  get className(){return [...this.classes].join(' ');}
  set className(value){this.classes=new Set(String(value).split(/\s+/).filter(Boolean));}
  get isConnected(){return this.parent?this.parent.isConnected:this.root;}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];this.append(...children);}
  get firstElementChild(){return this.children[0];}
  remove(){this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
  setAttribute(key,value){this[key]=value;}
  addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
  querySelector(selector){for(const child of this.children){if(child.classes.has(selector.slice(1)))return child;const nested=child.querySelector(selector);if(nested)return nested;}return null;}
 }
 let now=0,id=0;const timers=new Map(),elements=new Map();
 const get=key=>elements.get(key)||elements.set(key,new Element('div',true)).get(key);
 for(const key of ['smartComments','replyToMe','autoChat','sendMemes'])get(key).checked=true;
 for(const [key,value]of Object.entries({audienceInterval:'6',koreanMix:'0',memeFrequency:'35',swearLevel:'0',chatSpeed:'3',viewers:'12800',likes:'86000'}))get(key).value=value;
 get('media').paused=true;
 class FakeDate extends Date{static now(){return now;}}
 const math=Object.create(Math);math.random=()=>0;
 const sandbox={console,Math:math,Date:FakeDate,Intl,URL,setTimeout(callback,delay){timers.set(++id,{callback,due:now+delay});return id;},clearTimeout(key){timers.delete(key);},setInterval(){return ++id;},addEventListener(){},document:{hidden:false,getElementById:get,createElement:tag=>new Element(tag),querySelector:()=>get('uploadZone'),addEventListener(){},body:new Element('body',true)}};
 sandbox.window=sandbox;const context=vm.createContext(sandbox);
 for(const filename of ['app.js','meme-pack.js','audience-core.js','audience.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',filename),'utf8'),context,{filename});
 const advance=ms=>{const target=now+ms;while(true){let next=null;for(const entry of timers)if(entry[1].due<=target&&(!next||entry[1].due<next[1].due))next=entry;if(!next)break;timers.delete(next[0]);now=next[1].due;next[1].callback();}now=target;};
 get('autoChat').checked=false;for(const callback of get('autoChat').listeners.change)callback({target:get('autoChat')});
 let prevented=false;get('liveChatInput').value='ㅋㅋㅋㅋ';get('liveChatForm').listeners.submit[0]({preventDefault(){prevented=true;}});
 const original=get('chatFeed').children.at(-1);assert.equal(original.children[2].textContent,'ㅋㅋㅋㅋ');assert.equal(get('liveChatInput').value,'');assert.equal(prevented,true);
 advance(700);assert.equal(original.querySelector('.comment-reactions').textContent,'😂 1');
 advance(1500);const reply=get('chatFeed').children.at(-1);assert.notEqual(reply,original);assert.equal(reply.querySelector('.reply-reference').textContent,'回复 我 · ㅋㅋㅋㅋ');assert.match(reply.children[2].textContent,/[가-힣]/);
 const before=original.children.length;original.remove();context.reactComment(original,'❤️','阿晨');assert.equal(original.children.length,before);
});
