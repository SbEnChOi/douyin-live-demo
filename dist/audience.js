'use strict';
(() => {
 const get=id=>document.getElementById(id),core=LiveAudienceCore.create(),memes=window.LiveMemePack?.create();
 let automaticTimer=0,replyTimer=0,replyQueue=[],events=[],face=null,previousFace=null,lastFaceEvent=0,generation=0;
 const reactionTimers=new Set();
 const enabled=()=>get('smartComments').checked;
 const repliesEnabled=()=>enabled()&&(get('replyToMe')?.checked??true);
 const control=get('audienceStatus'),typing=get('audienceTyping');
 function seedComments(){const feed=get('chatFeed');if(!feed?.children)return;if(window.resetChatFeed)window.resetChatFeed();else feed.replaceChildren();for(let i=0;i<4;i++)display(core.automatic(context()));}
 function context(){const sameSource=face?.generation===mediaGeneration,stillFrame=mediaKind==='image'||(get('media').paused&&face?.videoTime===get('media').currentTime);return {filter:get('stage').dataset.faceFilter||'',reaction:get('stage').dataset.reaction||'',media:mediaKind,viewers:Number(get('viewers').value)||1,koreanRatio:Number(get('koreanMix').value)/100,face:sameSource&&(Date.now()-face.at<4000||stillFrame)?face:null,chinaTime:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()),sendMemes:get('sendMemes')?.checked??true,mediaRatio:Number(get('memeFrequency')?.value||35)/100,swearLevel:Number(get('swearLevel')?.value||1)};}
 function setStatus(message){control.textContent=message;}
 function event(topic){if(!enabled())return;events.push({topic,at:Date.now()});if(events.length>8)events.shift();}
 function pickEvent(){events=events.filter(e=>Date.now()-e.at<14000);return events.pop()||null;}
 function display(comment){const styled=comment.followup||comment.custom?comment:memes?.decorate(comment,context(),{message:comment.question||'',isReply:!!comment.question})||comment;addComment(styled.text,styled.name,false,styled.attachment,comment.question?{name:'我',text:comment.question}:null);get('stage').dataset.lastAudienceTopic=comment.topic||'reply';}
 function stopTyping(){typing.hidden=true;get('stage').classList.remove('awaiting-viewers');}
 function cancelReplies(){generation++;clearTimeout(replyTimer);replyQueue=[];for(const timer of reactionTimers)clearTimeout(timer);reactionTimers.clear();stopTyping();}
 function planAutomatic(){clearTimeout(automaticTimer);if(!enabled()||!get('autoChat').checked)return;
  const interval=Math.max(.8,Number(get('audienceInterval').value)||2)*1000;
  automaticTimer=setTimeout(()=>{if(!enabled())return;if(!document.hidden&&!replyQueue.length){const scene=pickEvent(),next=core.automatic(context(),scene);next.scene=!!scene;if(custom.length&&Math.random()<.25){next.text=pick(custom);next.custom=true;}display(next);}planAutomatic();},interval*(.82+Math.random()*.36));
 }
 function drainReplies(){
  clearTimeout(replyTimer);if(!repliesEnabled()||!replyQueue.length){stopTyping();planAutomatic();return;}
  clearTimeout(automaticTimer);const comment=replyQueue[0];typing.textContent=comment.name+' 正在输入…';typing.hidden=false;get('stage').classList.add('awaiting-viewers');const current=generation;
  const delay=comment.followup?1100+Math.random()*900:2200+Math.random()*1600;
  replyTimer=setTimeout(()=>{if(current!==generation||!repliesEnabled())return;replyQueue.shift();display(comment);stopTyping();if(replyQueue.length)drainReplies();else{setStatus(get('autoChat').checked?'整活中 · 也会回复我的评论。':'自动评论已暂停 · 仍会回复我的评论。');planAutomatic();}},delay);
 }
 function ask(message,row=null){message=String(message||'').trim().slice(0,180);if(!message||!repliesEnabled())return;if(replyQueue.length>=9){toast('评论太多啦，请稍等一下。');return;}const answer=core.reply(message,context());if(row){const current=generation,timer=setTimeout(()=>{reactionTimers.delete(timer);if(current===generation&&repliesEnabled())window.reactComment?.(row,answer.reaction||'😂',answer.comments[0].name);},700+Math.random()*800);reactionTimers.add(timer);}const alreadyPending=replyQueue.length>0;const comments=answer.comments.slice(0,2).map((c,index)=>({...c,topic:answer.topic,followup:index>0,question:message}));replyQueue.push(...comments);setStatus('正在读我的评论 · 很快回复。');if(!alreadyPending)drainReplies();}
 function configure(){cancelReplies();clearTimeout(automaticTimer);events=[];window.liveEffects?.watchFaces(enabled());
  if(enabled()){clearTimeout(chatTimer);setStatus('整活模式 · 记住问题并用玩笑回应。');planAutomatic();syncInterval();$('simulationState').textContent=get('autoChat').checked?'观众整活进行中':'自动评论已暂停';}
  else{setStatus('观众互动已关闭 · 使用示例评论。');get('speedValue').textContent=['非常慢','悠闲','自然','活跃','非常快'][Number(get('chatSpeed').value)-1];scheduleChat();$('simulationState').textContent=get('autoChat').checked?'自动评论进行中':'自动评论已暂停';}
 }
 window.addEventListener('live:scene',e=>event(e.detail.topic));
 window.addEventListener('live:face',e=>{
  const current={...e.detail,at:Date.now(),generation:mediaGeneration,videoTime:get('media').currentTime};face=current;if(current.reason==='source_changed'){previousFace=null;return;}
  if(current.present&&enabled()&&Date.now()-lastFaceEvent>5000){let topic='';
   if(!previousFace?.present)topic=current.count>1?'face_many':'face_enter';
   else if(current.count>previousFace.count)topic='face_many';
   else if(current.size>previousFace.size*1.3)topic='face_close';
   else if(current.size<previousFace.size*.73)topic='face_away';
   else if(Math.abs(current.x-previousFace.x)>.12)topic='face_move';
   if(topic){event(topic);lastFaceEvent=Date.now();previousFace=current;}
  }
  if(!previousFace||!current.present)previousFace=current;
 });
 get('smartComments').addEventListener('change',configure);
 get('replyToMe')?.addEventListener('change',()=>{cancelReplies();setStatus(repliesEnabled()?'已开启回复我的评论 · 不提问也会回应。':'回复我的评论已关闭');planAutomatic();});
 const intervalSteps=[8,4,2,1.2,.8];
 function syncInterval(){const seconds=Number(get('audienceInterval').value);get('audienceIntervalValue').textContent=seconds+' 秒';if(enabled()){get('chatSpeed').value=String(intervalSteps.reduce((best,n,i)=>Math.abs(n-seconds)<Math.abs(intervalSteps[best]-seconds)?i:best,0)+1);get('speedValue').textContent=seconds+' 秒间隔';}}
 get('audienceInterval').addEventListener('input',()=>{syncInterval();planAutomatic();});
 get('chatSpeed').addEventListener('input',e=>{if(enabled()){get('audienceInterval').value=String(intervalSteps[Number(e.target.value)-1]);syncInterval();planAutomatic();}});
 get('koreanMix').addEventListener('input',e=>{const ratio=Number(e.target.value);get('koreanMixValue').textContent='韩语 '+ratio+'% · 中文 '+(100-ratio)+'%';});
 get('autoChat').addEventListener('change',()=>{if(enabled()){setStatus(get('autoChat').checked?'观众互动进行中':repliesEnabled()?'自动评论已暂停 · 仍会回复我的评论。':'自动评论和我的评论回复已暂停');planAutomatic();}});
 get('restartPreview').addEventListener('click',()=>{core.reset();memes?.reset();face=null;previousFace=null;lastFaceEvent=0;configure();if(enabled())seedComments();});
 get('memeFrequency')?.addEventListener('input',e=>{get('memeFrequencyValue').textContent=e.target.value+'%';});
 get('previewMeme')?.addEventListener('click',()=>{if(!get('sendMemes').checked){toast('请先开启 GIF/图片评论。');return;}const preview=memes.decorate({name:'星星不睡觉',text:'SON 😭 哥们这个直播间，我先发张表情包再说',topic:'joke'},context(),{message:'SON 表情包',isReply:true,forceMedia:true});addComment(preview.text,preview.name,false,preview.attachment);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled()&&!replyQueue.length)planAutomatic();});
 window.addEventListener('pagehide',()=>{cancelReplies();clearTimeout(automaticTimer);});
 window.liveAudience={enabled,ask};configure();syncInterval();if(enabled())seedComments();
})();
