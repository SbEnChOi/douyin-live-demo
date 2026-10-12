'use strict';
(() => {
 const get=id=>document.getElementById(id),core=LiveAudienceCore.create(),memes=window.LiveMemePack?.create();
 let automaticTimer=0,replyTimer=0,replyQueue=[],events=[],face=null,previousFace=null,lastFaceEvent=0,generation=0;
 const enabled=()=>get('smartComments').checked;
 const control=get('audienceStatus'),typing=get('audienceTyping');
 function context(){const sameSource=face?.generation===mediaGeneration,stillFrame=mediaKind==='image'||(get('media').paused&&face?.videoTime===get('media').currentTime);return {filter:get('stage').dataset.faceFilter||'',reaction:get('stage').dataset.reaction||'',media:mediaKind,viewers:Number(get('viewers').value)||1,koreanRatio:Number(get('koreanMix').value)/100,face:sameSource&&(Date.now()-face.at<4000||stillFrame)?face:null,chinaTime:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()),sendMemes:get('sendMemes')?.checked??true,mediaRatio:Number(get('memeFrequency')?.value||35)/100,swearLevel:Number(get('swearLevel')?.value||1)};}
 function setStatus(message){control.textContent=message;}
 function event(topic){if(!enabled())return;events.push({topic,at:Date.now()});if(events.length>8)events.shift();}
 function pickEvent(){events=events.filter(e=>Date.now()-e.at<14000);return events.pop()||null;}
 function display(comment){const styled=comment.followup||comment.custom?comment:memes?.decorate(comment,context(),{message:comment.question||'',isReply:!!comment.question})||comment;addComment(styled.text,styled.name,false,styled.attachment);get('stage').dataset.lastAudienceTopic=comment.topic||'reply';}
 function stopTyping(){typing.hidden=true;get('stage').classList.remove('awaiting-viewers');}
 function planAutomatic(){clearTimeout(automaticTimer);if(!enabled()||!get('autoChat').checked)return;
  const interval=Number(get('audienceInterval').value)*1000;
  automaticTimer=setTimeout(()=>{if(!enabled())return;if(!document.hidden&&!replyQueue.length){const scene=pickEvent(),next=core.automatic(context(),scene);next.scene=!!scene;if(custom.length&&Math.random()<.25){next.text=pick(custom);next.custom=true;}display(next);}planAutomatic();},interval*(.82+Math.random()*.36));
 }
 function drainReplies(){
  clearTimeout(replyTimer);if(!enabled()||!replyQueue.length){stopTyping();planAutomatic();return;}
  clearTimeout(automaticTimer);const comment=replyQueue[0];typing.textContent=comment.name+' 正在输入…';typing.hidden=false;get('stage').classList.add('awaiting-viewers');const current=generation;
  const delay=comment.followup?1100+Math.random()*900:2200+Math.random()*1600;
  replyTimer=setTimeout(()=>{if(current!==generation||!enabled())return;replyQueue.shift();display(comment);stopTyping();if(replyQueue.length)drainReplies();else{setStatus(get('autoChat').checked?'드립 치는 중 · 중국어 댓글 + 가끔 한국어 밈':'자동 댓글 일시정지 · 질문 드립은 계속 답해요.');planAutomatic();}},delay);
 }
 function ask(message){if(!enabled())return;if(replyQueue.length>=9){toast('댓글창 드립이 밀렸어요ㅋㅋ 잠깐만 기다려주세요.');return;}const answer=core.reply(message,context());const alreadyPending=replyQueue.length>0;const comments=answer.comments.slice(0,2).map((c,index)=>({...c,topic:answer.topic,followup:index>0,question:message}));replyQueue.push(...comments);setStatus('시청자들이 질문을 읽고 드립을 준비 중ㅋㅋ');if(!alreadyPending)drainReplies();}
 function configure(){generation++;clearTimeout(replyTimer);clearTimeout(automaticTimer);replyQueue=[];events=[];stopTyping();window.liveEffects?.watchFaces(enabled());
  if(enabled()){clearTimeout(chatTimer);setStatus('농담 모드 · 질문을 기억하고 드립으로 받아쳐요.');planAutomatic();syncInterval();$('simulationState').textContent=get('autoChat').checked?'시청자 드립 진행 중':'자동 댓글 일시정지';}
  else{setStatus('시청자 반응 꺼짐 · 기존 샘플 댓글을 사용해요.');get('speedValue').textContent=['아주 느리게','여유롭게','자연스럽게','활기차게','아주 빠르게'][Number(get('chatSpeed').value)-1];scheduleChat();$('simulationState').textContent=get('autoChat').checked?'자동 댓글 진행 중':'자동 댓글 일시정지';}
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
 const intervalSteps=[15,10,6,4,2];
 function syncInterval(){const seconds=Number(get('audienceInterval').value);get('audienceIntervalValue').textContent=seconds+'초';if(enabled()){get('chatSpeed').value=String(intervalSteps.reduce((best,n,i)=>Math.abs(n-seconds)<Math.abs(intervalSteps[best]-seconds)?i:best,0)+1);get('speedValue').textContent=seconds+'초 간격';}}
 get('audienceInterval').addEventListener('input',()=>{syncInterval();planAutomatic();});
 get('chatSpeed').addEventListener('input',e=>{if(enabled()){get('audienceInterval').value=String(intervalSteps[Number(e.target.value)-1]);syncInterval();planAutomatic();}});
 get('koreanMix').addEventListener('input',e=>{get('koreanMixValue').textContent=e.target.value+'%';});
 get('autoChat').addEventListener('change',()=>{if(enabled()){setStatus(get('autoChat').checked?'시청자 반응 진행 중':'자동 댓글 일시정지 · 질문에는 답해요.');planAutomatic();}});
 get('restartPreview').addEventListener('click',()=>{core.reset();memes?.reset();face=null;previousFace=null;lastFaceEvent=0;configure();});
 get('memeFrequency')?.addEventListener('input',e=>{get('memeFrequencyValue').textContent=e.target.value+'%';});
 get('previewMeme')?.addEventListener('click',()=>{if(!get('sendMemes').checked){toast('GIF·이미지 댓글 사용을 먼저 켜주세요.');return;}const preview=memes.decorate({name:'星星不睡觉',text:'SON 😭 哥们这个直播间，我先发张表情包再说',topic:'joke'},context(),{message:'SON 짤 보내줘',isReply:true,forceMedia:true});addComment(preview.text,preview.name,false,preview.attachment);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled()&&!replyQueue.length)planAutomatic();});
 window.addEventListener('pagehide',()=>{clearTimeout(replyTimer);clearTimeout(automaticTimer);});
 window.liveAudience={enabled,ask};configure();syncInterval();
})();
