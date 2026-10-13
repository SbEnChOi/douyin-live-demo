'use strict';
const $ = id => document.getElementById(id);
const names = ['小雨','林小可','爱笑的橙子','星星不睡觉','小丸子','阿晨','奶茶三分糖','晚风','可可','是小鹿呀','幸运锦鲤','甜心小熊','用户8392','月亮邮递员','一颗草莓'];
const samples = ['主播好漂亮！😍','大家晚上好～','来了来了 👋','这个直播间氛围好好','太棒了 ❤️','已经关注啦！','姐姐好有气质 ✨','每天都来看看你','喜欢这个感觉 💕','新来的朋友点点关注～','哈哈哈好可爱','支持支持！！','晚上好呀主播 🌙','忍不住点赞了 ❤️','从推荐进来的，爱了','终于等到开播啦','大家一起点点赞 👏','主播看一下我～','今天也要开心呀 🌸','声音好好听！'];
const speeds=[8000,4000,2000,1200,800];
let running=true,chatTimer,heartTimer,arrivalTimer,custom=[],likes=86000,viewers=12800,mediaUrl=null,cameraStream=null,mediaKind='none',mediaGeneration=0,giftTimer,toastTimer,stageToastTimer,controlsTimer;
const pick = a => a[Math.floor(Math.random()*a.length)];
let chatPinned=true,unreadComments=0;
const maxCommentHistory=500;
function updateChatScroll(newComment=false){const area=$('chatArea'),latest=$('chatLatest');area.classList.toggle('is-reading',!chatPinned);if(chatPinned){area.scrollTop=area.scrollHeight;unreadComments=0;}else if(newComment)unreadComments++;if(latest){latest.hidden=chatPinned;latest.textContent=unreadComments?'新评论 '+unreadComments+' ↓':'回到最新 ↓';}}
function jumpToLatest(){chatPinned=true;updateChatScroll();}
function resetChatFeed(){chatPinned=true;unreadComments=0;$('chatFeed').replaceChildren();updateChatScroll();}
$('chatArea').addEventListener('scroll',()=>{const area=$('chatArea');chatPinned=area.scrollHeight-(area.clientHeight||0)-area.scrollTop<=24;updateChatScroll();},{passive:true});
$('chatLatest')?.addEventListener('click',jumpToLatest);
function numberLabel(n){return n>=10000?(n/10000).toFixed(1)+'万':n.toLocaleString('zh-CN');}
function updateCounts(){ $('likesDisplay').textContent=numberLabel(likes);$('viewerDisplay').textContent=numberLabel(viewers); }
function toast(message){$('globalToast').textContent=message;$('globalToast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('globalToast').classList.remove('visible'),3000);}
function stageToast(message){$('stageToast').textContent=message;$('stageToast').classList.add('visible');clearTimeout(stageToastTimer);stageToastTimer=setTimeout(()=>$('stageToast').classList.remove('visible'),2200);}
function addComment(text=pick(custom.length?custom:samples),name=pick(names),self=false,attachment=null,replyTo=null){
 if(self)jumpToLatest();
 const row=document.createElement('div');row.className='chat-row'+(self?' self':'');
 const level=document.createElement('span');level.className='level';level.textContent='♬ '+(3+Math.floor(Math.random()*29));
 const username=document.createElement('span');username.className='name';username.textContent=name+'：';
 const content=document.createElement('span');content.textContent=text;row.append(level,username,content);
 if(replyTo?.text){row.classList.add('is-reply');const reference=document.createElement('small');reference.className='reply-reference';reference.textContent='回复 '+(replyTo.name||'我')+' · '+String(replyTo.text).slice(0,42);row.append(reference);}
 const meme=window.LiveMemePack?.get(attachment);if(meme){row.classList.add('has-attachment');const button=document.createElement('button');button.className='chat-media';button.type='button';button.setAttribute('aria-label','查看表情：'+meme.title);const img=document.createElement('img');img.src=meme.src;img.alt=meme.title;img.decoding='async';img.width=meme.width;img.height=meme.height;const badge=document.createElement('span');badge.className='media-badge';badge.textContent=meme.kind==='gif'?'GIF':'IMG';const caption=document.createElement('span');caption.className='media-caption';caption.textContent=meme.title;button.append(img,badge,caption);button.addEventListener('click',()=>showMemePreview(meme.id));img.addEventListener('load',()=>updateChatScroll());img.addEventListener('error',()=>{button.classList.add('media-failed');caption.textContent=meme.title+' · 图片暂时不可用';updateChatScroll();});row.append(button);}
 $('chatFeed').append(row);
 while($('chatFeed').children.length>maxCommentHistory){const feed=$('chatFeed'),before=feed.scrollHeight;feed.firstElementChild.remove();if(!chatPinned)$('chatArea').scrollTop=Math.max(0,$('chatArea').scrollTop-(before-feed.scrollHeight));}
 $('chatArea').classList.toggle('has-chat-media',!!$('chatFeed').querySelector('.has-attachment'));updateChatScroll(true);
 return row;
}
function reactComment(row,emoji,name){if(!row?.isConnected)return;let reactions=row.querySelector('.comment-reactions');if(!reactions){reactions=document.createElement('span');reactions.className='comment-reactions';row.append(reactions);}reactions.textContent=emoji+' 1';reactions.title=name+' 对这条评论作出回应';reactions.setAttribute('aria-label',name+' 的反应：'+emoji);updateChatScroll();}
function showMemePreview(id){const meme=window.LiveMemePack?.get(id);if(!meme)return;$('sheetTitle').textContent=meme.title;$('sheetContent').replaceChildren();const img=document.createElement('img');img.className='meme-detail-image';img.src=meme.src;img.alt=meme.title;const credit=document.createElement('p');credit.className='meme-credit';credit.textContent=meme.credit;const source=document.createElement('a');source.className='meme-source';source.href=meme.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='查看原出处 ↗';$('sheetContent').append(img,credit,source);$('sheet').classList.add('meme-sheet');$('sheet').hidden=false;}
function scheduleChat(){clearTimeout(chatTimer);if(!running||window.liveAudience?.enabled())return;chatTimer=setTimeout(()=>{addComment();scheduleChat();},speeds[+$('chatSpeed').value-1]*(.85+Math.random()*.3));}
function heart(){const h=document.createElement('span');h.className='floating-heart';h.textContent='♥';h.style.color=pick(['#ff436d','#ff86ad','#ffb7cc','#ff6589','#d898ff']);h.style.left=Math.random()*45+'%';h.style.setProperty('--drift',(Math.random()*15-7)+'cqw');h.style.setProperty('--tilt',(Math.random()*45-22)+'deg');$('heartField').append(h);h.addEventListener('animationend',()=>h.remove());}
function burst(){for(let i=0;i<9;i++)setTimeout(heart,i*100);likes+=9;$('likes').value=likes;updateCounts();}
function rose(){clearTimeout(giftTimer);$('giftOverlay').hidden=false;giftTimer=setTimeout(()=>$('giftOverlay').hidden=true,3600);}
function init(){resetChatFeed();addComment('欢迎来到直播间！喜欢就点点关注吧 ❤️','直播助手');for(let i=0;i<5;i++)addComment();updateCounts();scheduleChat();}
function releaseMedia(){mediaGeneration++;if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}$('media').pause();$('media').srcObject=null;$('media').removeAttribute('src');$('media').load();$('media').hidden=true;$('backgroundImage').hidden=true;$('backgroundImage').removeAttribute('src');if(mediaUrl){URL.revokeObjectURL(mediaUrl);mediaUrl=null;}mediaKind='none';$('backdrop').hidden=false;$('emptyState').hidden=false;$('playMedia').disabled=true;$('playMedia').textContent='영상 일시정지';$('cameraButton').innerHTML='<svg><use href="#i-camera"/></svg>카메라 켜기';$('sourceStatus').textContent='기본 배경';$('mediaHint').textContent='추가한 파일은 이 브라우저에서만 사용됩니다.';$('mediaFile').value='';}
async function useFile(file){if(!file)return;if(!file.type.startsWith('video/')&&!file.type.startsWith('image/')){toast('영상 또는 이미지 파일을 선택해주세요.');return;}releaseMedia();const generation=mediaGeneration;mediaUrl=URL.createObjectURL(file);$('sourceStatus').textContent=file.name;$('emptyState').hidden=true;
 if(file.type.startsWith('image/')){mediaKind='image';$('backgroundImage').src=mediaUrl;$('backgroundImage').hidden=false;$('backdrop').hidden=true;}
 else{mediaKind='video';$('media').src=mediaUrl;$('media').hidden=false;$('backdrop').hidden=true;$('media').muted=!$('audio').checked;$('playMedia').disabled=false;try{await $('media').play();}catch{if(generation===mediaGeneration){$('playMedia').textContent='영상 재생';toast('영상 재생 버튼을 눌러주세요.');}}}
 $('mediaHint').textContent='다른 파일을 추가하면 배경이 교체됩니다.';
}
$('mediaFile').addEventListener('change',e=>useFile(e.target.files[0]));
const dropZone=document.querySelector('.upload-zone');['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.add('dragover');}));['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove('dragover');if(type==='drop')useFile(e.dataTransfer.files[0]);}));
$('backgroundImage').addEventListener('error',()=>{releaseMedia();toast('이미지를 열 수 없습니다. JPG 또는 PNG를 사용해주세요.');});
$('media').addEventListener('error',()=>{if(mediaKind==='video'){releaseMedia();toast('재생할 수 없는 영상입니다. MP4(H.264)나 WebM을 사용해주세요.');}});
$('cameraButton').addEventListener('click',async()=>{if(cameraStream){releaseMedia();return;}if(!navigator.mediaDevices?.getUserMedia){toast('카메라는 HTTPS 또는 localhost에서 사용할 수 있습니다.');return;}releaseMedia();const generation=mediaGeneration;$('cameraButton').disabled=true;$('cameraButton').textContent='카메라 연결 중…';try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1080},height:{ideal:1920}},audio:false});if(generation!==mediaGeneration){stream.getTracks().forEach(t=>t.stop());return;}cameraStream=stream;mediaKind='camera';$('media').srcObject=stream;$('media').muted=true;$('media').hidden=false;$('backdrop').hidden=true;$('emptyState').hidden=true;await $('media').play();$('cameraButton').innerHTML='<svg><use href="#i-camera"/></svg>카메라 끄기';$('sourceStatus').textContent='카메라 사용 중';$('mediaHint').textContent='카메라 끄기를 누르면 카메라 사용이 종료됩니다.';}catch(e){if(generation===mediaGeneration){releaseMedia();toast(e.name==='NotAllowedError'?'카메라 권한이 필요합니다. 브라우저에서 카메라를 허용해주세요.':'카메라를 연결하지 못했습니다. 다른 앱에서 사용 중인지 확인해주세요.');}}finally{$('cameraButton').disabled=false;if(generation!==mediaGeneration&&!cameraStream)$('cameraButton').innerHTML='<svg><use href="#i-camera"/></svg>카메라 켜기';}});
$('clearMedia').addEventListener('click',releaseMedia);
$('playMedia').addEventListener('click',async()=>{if(mediaKind!=='video')return;try{if($('media').paused){await $('media').play();$('playMedia').textContent='영상 일시정지';}else{$('media').pause();$('playMedia').textContent='영상 재생';}}catch{toast('이 영상을 재생할 수 없습니다. 다른 영상을 선택해주세요.');}});
$('mirror').addEventListener('change',e=>{['media','backgroundImage'].forEach(id=>$(id).classList.toggle('media-mirrored',e.target.checked));});
$('audio').addEventListener('change',e=>{if(mediaKind==='video')$('media').muted=!e.target.checked;});
$('hostName').addEventListener('input',e=>{const name=e.target.value.trim()||'直播间';$('hostDisplay').textContent=name;$('hostAvatar').textContent=Array.from(name)[0];});
for(const id of ['viewers','likes'])$(id).addEventListener('input',e=>{const n=Number(e.target.value);if(!Number.isFinite(n))return;const v=Math.min(99999999,Math.max(id==='viewers'?1:0,Math.round(n)));if(id==='viewers')viewers=v;else likes=v;updateCounts();});
$('autoChat').addEventListener('change',e=>{running=e.target.checked;$('simulationState').textContent=running?'자동 댓글 진행 중':'자동 댓글 일시정지';scheduleChat();});
$('chatSpeed').addEventListener('input',e=>{$('speedValue').textContent=['아주 느리게','여유롭게','자연스럽게','활기차게','아주 빠르게'][e.target.value-1];scheduleChat();});
$('applyComments').addEventListener('click',()=>{custom=$('customComments').value.split('\n').map(s=>s.trim().slice(0,120)).filter(Boolean).slice(0,200);toast(custom.length?custom.length+'개 댓글 문구를 적용했습니다.':'중국어 샘플 댓글을 사용합니다.');});
$('showSticker').addEventListener('change',e=>$('liveSticker').hidden=!e.target.checked);
$('liveChatForm').addEventListener('submit',e=>{e.preventDefault();const value=$('liveChatInput').value.trim();if(value){const row=addComment(value,'我',true);$('liveChatInput').value='';window.liveAudience?.ask(value,row);}});
$('follow').addEventListener('click',()=>{const followed=$('follow').textContent==='已关注';$('follow').textContent=followed?'关注':'已关注';$('follow').style.background=followed?'':'#ffffff33';stageToast(followed?'已取消关注':'关注成功 ❤️');});
['burstButton','likeButton'].forEach(id=>$(id).addEventListener('click',burst));$('roseButton').addEventListener('click',rose);
function closeSheet(){ $('sheet').hidden=true;$('sheet').classList.remove('meme-sheet'); }
$('sheetClose').addEventListener('click',closeSheet);
$('shoppingBag').addEventListener('click',()=>{closeSheet();$('sheetTitle').textContent='购物袋';$('sheetContent').innerHTML='<div class="sheet-emoji">🛍️</div><p>主播还没有添加商品</p><p>好物即将上线，敬请期待</p>';$('sheet').hidden=false;});
$('giftButton').addEventListener('click',()=>{closeSheet();$('sheetTitle').textContent='送礼物';$('sheetContent').innerHTML='<div class="gift-options"><button class="gift-choice" id="sendRose">🌹 送一朵玫瑰</button><button class="gift-choice" data-gift-effect="fireworks">🎆 烟花盛典</button><button class="gift-choice" data-gift-effect="fire">🔥 火力全开</button><button class="gift-choice" data-gift-effect="party">🎉 派对时间</button></div><p>给主播一点小小的鼓励</p>';$('sendRose').addEventListener('click',()=>{closeSheet();rose();});$('sheetContent').querySelectorAll('[data-gift-effect]').forEach(button=>button.addEventListener('click',()=>{closeSheet();window.liveEffects?.reaction(button.dataset.giftEffect);}));$('sheet').hidden=false;});
$('shareButton').addEventListener('click',()=>stageToast('邀请朋友一起看直播 ✨'));
$('stageClose').addEventListener('click',()=>{if(document.body.classList.contains('capture'))exitCapture();else stageToast('欢迎来到直播间 ❤️');});
function showControls(){document.body.classList.add('show-controls');clearTimeout(controlsTimer);controlsTimer=setTimeout(()=>document.body.classList.remove('show-controls'),2200);}
function enterCapture(){closeSheet();document.body.classList.add('capture');showControls();}
function exitCapture(){document.body.classList.remove('capture','show-controls');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
['captureTop','captureButton'].forEach(id=>$(id).addEventListener('click',enterCapture));$('exitCapture').addEventListener('click',exitCapture);
$('fullscreenButton').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('이 브라우저에서는 전체 화면이 지원되지 않습니다.');}catch{toast('전체 화면 전환이 지원되지 않습니다. 촬영 모드를 이용해주세요.');}});
document.addEventListener('mousemove',()=>{if(document.body.classList.contains('capture'))showControls();});document.addEventListener('touchstart',()=>{if(document.body.classList.contains('capture'))showControls();},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();exitCapture();}if(e.key.toLowerCase()==='f'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();document.body.classList.contains('capture')?exitCapture():enterCapture();}});
$('restartPreview').addEventListener('click',()=>{clearTimeout(giftTimer);$('giftOverlay').hidden=true;$('heartField').replaceChildren();closeSheet();likes=Math.max(0,Number($('likes').value)||0);viewers=Math.max(1,Number($('viewers').value)||1);init();if(mediaKind==='video'){$('media').currentTime=0;}toast('시연을 다시 시작했습니다.');});
heartTimer=setInterval(()=>{if($('autoHearts').checked&&!document.hidden)heart();},900);arrivalTimer=setInterval(()=>{if(running&&!document.hidden)$('arrival').textContent='✨ '+pick(names)+' 进入了直播间';},4200);
window.addEventListener('pagehide',()=>{if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());});
init();
