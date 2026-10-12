'use strict';
let detector;
self.onmessage = async ({data}) => {
 if(data.type==='init') {
  try {
   const {FaceDetector,FilesetResolver} = await import('./vendor/vision_bundle.mjs');
   const fileset = await FilesetResolver.forVisionTasks(new URL('./vendor/wasm/',self.location.href).href.replace(/\/$/,''));
   detector = await FaceDetector.createFromOptions(fileset,{baseOptions:{modelAssetPath:new URL('./vendor/blaze_face_short_range.tflite',self.location.href).href,delegate:'CPU'},runningMode:'IMAGE',minDetectionConfidence:.45});
   self.postMessage({type:'ready'});
  } catch(error) {self.postMessage({type:'error',message:String(error.message)});}
 } else if(data.type==='frame') {
  try {
   const result=detector.detect(data.bitmap);
   const faces=result.detections.map(face=>({box:face.boundingBox,points:face.keypoints})).sort((a,b)=>b.box.width*b.box.height-a.box.width*a.box.height);
   self.postMessage({type:'result',face:faces[0]||null,width:data.bitmap.width,height:data.bitmap.height,generation:data.generation});
  } catch(error) {self.postMessage({type:'frame-error',generation:data.generation,message:String(error.message)});}
  finally {data.bitmap.close();}
 }
};
