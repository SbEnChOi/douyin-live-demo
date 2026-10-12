'use strict';
(() => {
 const get=id=>document.getElementById(id), stage=get('stage'), canvas=get('reactionCanvas'), ctx=canvas.getContext('2d');
 let width=1,height=1,particles=[],queue=[],reactionFrame=0,reactionStart=0,reactionKind='',lastReactionFrame=0;
 const colors=['#ff5af0','#50edff','#ffe47a','#8b7dff','#ff6585','#72ffbe'];
 const random=(a,b)=>a+Math.random()*(b-a);
 function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 new ResizeObserver(resize).observe(stage);resize();
 function particle(x,y,vx,vy,color,life,type='spark',size=2){if(particles.length>=650)return;particles.push({x,y,px:x,py:y,vx,vy,color,life,total:life,type,size,rotation:random(0,Math.PI*2),spin:random(-5,5),phase:random(0,Math.PI*2)});}
 function explode(x,y,color,count=70){for(let i=0;i<count;i++){const angle=i/count*Math.PI*2;const speed=random(width*.13,width*.55);particle(x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,color,random(.8,1.7),'spark',random(1.1,2.8));}for(let i=0;i<12;i++)particle(x,y,random(-70,70),random(-60,60),'#fff5c3',.65,'star',random(2,5));}
 function rocket(x,y,color){particle(x,height,0,-(height-y)/.62,color,.65,'rocket',3);queue.push({at:(performance.now()-reactionStart)/1000+.62,action:()=>explode(x,y,color,85)});}
 function setupReaction(kind){
  if(kind==='fireworks')for(let i=0;i<8;i++)queue.push({at:i*.42,action:()=>rocket(width*random(.13,.87),height*random(.16,.48),colors[i%colors.length])});
  if(kind==='fire')for(let i=0;i<35;i++)queue.push({at:i*.12,action:()=>{for(let j=0;j<10;j++){const x=width*random(.02,.98);particle(x,height+20,random(-22,22),-height*random(.24,.7),['#ff6f2e','#ffc84f','#fff4a9'][j%3],random(.8,1.5),'flame',width*random(.025,.065));}for(let j=0;j<4;j++)particle(width*random(.1,.9),height,random(-65,65),-height*random(.3,.85),'#ffd16c',random(1,2),'spark',random(1,3));}});
  if(kind==='party'){
   for(let wave=0;wave<4;wave++)queue.push({at:wave*.85,action:()=>{for(let i=0;i<80;i++){const side=i%2;particle(side?width:0,height*.67,(side?-1:1)*random(width*.13,width*.8),-height*random(.22,.72),colors[i%6],random(2,3.5),'confetti',random(3,7));}for(let i=0;i<16;i++)particle(width*.5,height*.4,random(-110,110),random(-210,-40),colors[i%6],2,'star',random(3,7));}});
  }
 }
 function drawReaction(now){
  const time=(now-reactionStart)/1000,dt=Math.min((now-lastReactionFrame)/1000,.04);lastReactionFrame=now;
  ctx.clearRect(0,0,width,height);
  const due=queue.filter(q=>q.at<=time);queue=queue.filter(q=>q.at>time);due.forEach(q=>q.action());
  if(reactionKind==='fire'){
   ctx.save();ctx.globalAlpha=Math.min(1,time*3)*Math.max(0,Math.min(1,(6-time)*1.4));const gradient=ctx.createLinearGradient(0,height*.65,0,height);gradient.addColorStop(0,'#ff791000');gradient.addColorStop(1,'#ff74007d');ctx.fillStyle=gradient;ctx.fillRect(0,height*.65,width,height*.35);
   ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ff9a23';ctx.shadowBlur=18;
   for(let i=0;i<9;i++){const x=width*i/8,w=width*.14,h=height*(.10+.10*(.5+.5*Math.sin(time*7+i*1.9))),sway=Math.sin(time*5+i)*w*.45;const flame=ctx.createLinearGradient(0,height-h,0,height);flame.addColorStop(0,'#ffd15200');flame.addColorStop(.3,'#ffad3466');flame.addColorStop(1,'#ff651dba');ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(x-w,height+5);ctx.bezierCurveTo(x-w,height-h*.65,x+sway-w*.3,height-h*.55,x+sway,height-h);ctx.bezierCurveTo(x+sway+w*.1,height-h*.35,x+w,height-h*.45,x+w,height+5);ctx.closePath();ctx.fill();}
   ctx.restore();
  }
  particles.forEach(p=>{
   p.life-=dt;p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.type==='flame'?-15:p.type==='rocket'?0:height*.18)*dt;p.rotation+=p.spin*dt;
   ctx.save();ctx.globalAlpha=Math.min(1,p.life/.3)*Math.min(1,(p.total-p.life)*8);ctx.fillStyle=p.color;ctx.strokeStyle=p.color;
   if(p.type==='spark'||p.type==='rocket'){ctx.globalCompositeOperation='lighter';ctx.lineWidth=p.size;ctx.shadowBlur=p.type==='rocket'?10:5;ctx.shadowColor=p.color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);ctx.stroke();}
   else if(p.type==='flame'){ctx.globalCompositeOperation='lighter';ctx.translate(p.x+Math.sin(time*8+p.phase)*p.size,p.y);const s=p.size*(p.life/p.total);ctx.shadowColor='#ff9b19';ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(0,-s*2.4);ctx.bezierCurveTo(s*1.8,-s*.1,s,s,0,s);ctx.bezierCurveTo(-s,s,-s*1.8,-s*.1,0,-s*2.4);ctx.fill();}
   else if(p.type==='confetti'){ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.scale(Math.cos(p.phase+time*8),1);ctx.fillRect(-p.size,-p.size*.6,p.size*2,p.size*1.2);}
   else {ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?p.size*.45:p.size,a=i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}
   ctx.restore();
  });
  particles=particles.filter(p=>p.life>0&&p.y<height+90);
  if(time>5.2)get('reactionBanner').hidden=true;
  if(particles.length||queue.length){reactionFrame=requestAnimationFrame(drawReaction);}else stopReaction();
 }
 function stopReaction(){cancelAnimationFrame(reactionFrame);reactionFrame=0;particles=[];queue=[];ctx.clearRect(0,0,width,height);get('reactionBanner').hidden=true;delete stage.dataset.reaction;}
 function triggerReaction(kind){
  if(!['fireworks','fire','party'].includes(kind))return;stopReaction();resize();reactionKind=kind;reactionStart=performance.now();lastReactionFrame=reactionStart;stage.dataset.reaction=kind;
  const info={fireworks:['🎆','烟花盛典'],fire:['🔥','火力全开'],party:['🎉','派对时间']}[kind];get('reactionEmoji').textContent=info[0];get('reactionTitle').textContent=info[1];get('reactionBanner').dataset.kind=kind;get('reactionBanner').hidden=false;get('reactionBanner').style.animation='none';void get('reactionBanner').offsetWidth;get('reactionBanner').style.animation='';setupReaction(kind);reactionFrame=requestAnimationFrame(drawReaction);window.dispatchEvent(new CustomEvent('live:scene',{detail:{topic:kind}}));
 }
 document.querySelectorAll('[data-reaction]').forEach(button=>button.addEventListener('click',()=>triggerReaction(button.dataset.reaction)));get('stopReaction').addEventListener('click',stopReaction);

 let filter='',observing=false,worker=null,workerState='idle',pending=false,captureStamp=0,sourceKey='',sourceGeneration=0,detected=null,pose=null,filterFrame=0,lastSourceTime=-1,lostAt=0;
 const mask=get('faceMask'), filterGroups={bunny:get('filterBunny'),pig:get('filterPig'),uncle:get('filterUncle')};
 function status(text,state='idle'){if(get('filterStatus').textContent!==text)get('filterStatus').textContent=text;get('filterStatus').dataset.state=state;stage.dataset.faceState=state;}
 function source(){if(!get('media').hidden&&get('media').readyState>=2)return get('media');if(!get('backgroundImage').hidden&&get('backgroundImage').complete&&get('backgroundImage').naturalWidth)return get('backgroundImage');return null;}
 function startWorker(){
  if(workerState==='loading'||workerState==='ready')return;
  workerState='loading';status('얼굴 추적 준비 중…');
  try{
   worker=new Worker(new URL('face-tracker.js',document.baseURI));
   worker.onmessage=({data})=>{
    if(data.type==='ready'){workerState='ready';captureStamp=0;}
    else if(data.type==='result'){pending=false;if(data.generation===sourceGeneration){detected=data.face?{...data.face,width:data.width,height:data.height}:null;if(detected)lostAt=0;else if(!lostAt)lostAt=performance.now();const cover=Math.max(width/data.width,height/data.height),ox=(width-data.width*cover)/2,oy=(height-data.height*cover)/2;const visible=(data.boxes||[]).filter(box=>{const x=(box.originX+box.width/2)*cover+ox,y=(box.originY+box.height/2)*cover+oy;return x>=0&&x<=width&&y>=0&&y<=height;});const box=visible[0];let x=box?((box.originX+box.width/2)*cover+ox)/width:0;if(get('mirror').checked)x=1-x;window.dispatchEvent(new CustomEvent('live:face',{detail:{present:!!box,count:visible.length,x,size:box?box.width*cover/width:0}}));}}
    else if(data.type==='error'||data.type==='frame-error'){failTracking(data.message);}
   };
   worker.onerror=event=>{event.preventDefault();failTracking(event.message);};
   worker.postMessage({type:'init'});
  }catch(error){failTracking(error.message);}
 }
 function failTracking(message){console.warn('Face tracking unavailable:',message);workerState='failed';pending=false;worker?.terminate();worker=null;detected=null;get('faceTrack').checked=false;status('자동 추적을 사용할 수 없습니다. 아래에서 위치를 직접 조절하세요.','error');}
 async function capture(sourceElement,now){
  pending=true;captureStamp=now;const generation=sourceGeneration;
  try{const sw=sourceElement.videoWidth||sourceElement.naturalWidth,sh=sourceElement.videoHeight||sourceElement.naturalHeight;const ratio=Math.min(1,512/Math.max(sw,sh));const bitmap=await createImageBitmap(sourceElement,{resizeWidth:Math.max(1,Math.round(sw*ratio)),resizeHeight:Math.max(1,Math.round(sh*ratio))});if((!filter&&!observing)||generation!==sourceGeneration||workerState!=='ready'){bitmap.close();pending=false;return;}worker.postMessage({type:'frame',bitmap,generation},[bitmap]);}catch{pending=false;}
 }
 function targetPose(face){
  const cover=Math.max(width/face.width,height/face.height),offsetX=(width-face.width*cover)/2,offsetY=(height-face.height*cover)/2;
  const map=p=>({x:p.x*face.width*cover+offsetX,y:p.y*face.height*cover+offsetY});
  let eyes=face.points.slice(0,2).map(map);if(get('mirror').checked)eyes=eyes.map(p=>({...p,x:width-p.x}));eyes.sort((a,b)=>a.x-b.x);
  const [left,right]=eyes,dx=right.x-left.x,dy=right.y-left.y;return {x:(left.x+right.x)/2,y:(left.y+right.y)/2,scale:Math.hypot(dx,dy)/106,angle:Math.atan2(dy,dx)*180/Math.PI};
 }
 function positionMask(target,smooth){if(!pose||!smooth)pose=target;else{for(const key of ['x','y','scale','angle'])pose[key]+=(target[key]-pose[key])*.45;}mask.style.transform=`translate(${pose.x-160}px,${pose.y-170}px) rotate(${pose.angle}deg) scale(${pose.scale})`;}
 function renderFilter(now){
  if(!filter&&!observing){filterFrame=0;return;}
  const element=source(),key=element?(element.id+':'+(element.currentSrc||element.src)+':'+mediaGeneration):'preview';
  if(key!==sourceKey){sourceKey=key;sourceGeneration++;detected=null;pose=null;lastSourceTime=-1;captureStamp=0;lostAt=0;window.dispatchEvent(new CustomEvent('live:face',{detail:{present:false,count:0,reason:'source_changed'}}));}
  if(element&&((filter&&get('faceTrack').checked)||observing)&&!document.hidden){if(workerState==='idle')startWorker();const newFrame=element.tagName==='IMG'?lastSourceTime<0:element.currentTime!==lastSourceTime;if(workerState==='ready'&&!pending&&now-captureStamp>=(filter?100:650)&&newFrame){lastSourceTime=element.tagName==='IMG'?0:element.currentTime;capture(element,now);}}
  if(!filter){mask.hidden=true;filterFrame=requestAnimationFrame(renderFilter);return;}
  get('sampleFace').toggleAttribute('hidden',!!element);
  if(!element||!get('faceTrack').checked){mask.hidden=false;positionMask({x:width*(+get('faceX').value/100),y:height*(+get('faceY').value/100),scale:width/430*(+get('faceSize').value/100),angle:0},false);if(!element)status('미리보기 · 카메라나 얼굴이 있는 영상을 추가해보세요.','preview');else if(workerState!=='failed')status('수동 위치 · 아래 슬라이더로 맞춰주세요.','manual');}
  else{
   if(detected){mask.hidden=false;positionMask(targetPose(detected),element.tagName!=='IMG');status('얼굴 추적 중 · 얼굴을 움직여보세요!','tracked');}
   else if(workerState==='ready'){if(!lostAt||now-lostAt>250)mask.hidden=true;status('얼굴 찾는 중 · 정면을 바라봐주세요.','searching');}
   else if(workerState==='loading'){mask.hidden=true;status('얼굴 추적 준비 중…','loading');}
  }
  filterFrame=requestAnimationFrame(renderFilter);
 }
 function selectFilter(kind){
  filter=filter===kind?'':kind;stage.dataset.faceFilter=filter;Object.entries(filterGroups).forEach(([key,group])=>group.toggleAttribute('hidden',key!==filter));document.querySelectorAll('[data-face-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.faceFilter===filter)));stage.classList.toggle('has-face-filter',!!filter);cancelAnimationFrame(filterFrame);pose=null;
  if(filter||observing)filterFrame=requestAnimationFrame(renderFilter);if(!filter){mask.hidden=true;status('카메라·영상·사진에 필터를 씌워보세요.');}if(filter)window.dispatchEvent(new CustomEvent('live:scene',{detail:{topic:filter}}));
 }
 document.querySelectorAll('[data-face-filter]').forEach(button=>button.addEventListener('click',()=>selectFilter(button.dataset.faceFilter)));get('filterOff').addEventListener('click',()=>{if(filter)selectFilter(filter);});
 get('faceTrack').addEventListener('change',()=>{detected=null;pose=null;captureStamp=0;lastSourceTime=-1;if(get('faceTrack').checked&&workerState==='failed'){workerState='idle';}});
 ['faceX','faceY','faceSize'].forEach(id=>get(id).addEventListener('input',()=>{get('faceTrack').checked=false;}));
 get('mirror').addEventListener('change',()=>{pose=null;});
 get('restartPreview').addEventListener('click',()=>{stopReaction();if(filter)selectFilter(filter);});
 document.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
  const reactions={'1':'fireworks','2':'fire','3':'party'},filters={'4':'bunny','5':'pig','6':'uncle'};
  if(reactions[event.key]){event.preventDefault();triggerReaction(reactions[event.key]);}else if(filters[event.key]){event.preventDefault();selectFilter(filters[event.key]);}else if(event.key==='0'){event.preventDefault();stopReaction();if(filter)selectFilter(filter);}
 });
 window.addEventListener('pagehide',()=>{worker?.terminate();cancelAnimationFrame(filterFrame);stopReaction();});
 window.liveEffects={reaction:triggerReaction,filter:selectFilter,stop:stopReaction,watchFaces(enabled){observing=enabled;if(enabled){lastSourceTime=-1;captureStamp=0;}cancelAnimationFrame(filterFrame);if(filter||observing)filterFrame=requestAnimationFrame(renderFilter);}};
})();
