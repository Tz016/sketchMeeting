
new p5(function(p){
  let fingerTrails = []
  let video
  let model
  let isDetectorReady = false;
  const indexout = new fp.GestureDescription('index_out');
      indexout.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl,1.0);
      indexout.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl,1.0);
      indexout.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl,1.0);
      for(let finger of [ fp.Finger.Thumb,fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        indexout.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
      }

      const splayout = new fp.GestureDescription('splayout');
     
      for(let finger of [fp.Finger.Thumb,fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        splayout.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
      }
     
  const GE = new fp.GestureEstimator([
        indexout,
        splayout,
      // fp.Gestures.ThumbsUpGesture
    ]);

    let smoothedX = 0;
let smoothedY = 0;
let smoothingFactor = 0.9; // 调整此值以控制平滑程度

p.setup=async function(){
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("canvasContainer");
    p.background(0);
    model = await handpose.load();
    isDetectorReady = true
    video = document.getElementById('video');
  
    // 使用 getUserMedia 方法获取摄像头视频流
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream; // 将视频流赋值给 <video> 元素的 srcObject 属性
        video.style.transform = 'scaleX(-1)';
        video.play();
    
        // 隐藏视频元素
        video.style.display = 'none';
        // video.style.width = p.windowWidth + 'px'; // 设置 video 元素的宽度为窗口宽度
        // video.style.height = p.windowHeight + 'px'; // 设置 video 元素的高度为窗口高度
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });

      
      
}

p.draw=async function (){
  if (!isDetectorReady) {
    return;
}
  p.background(0)
  for (let i = 0; i < fingerTrails.length; i++) {
    const trail = fingerTrails[i];
    const alpha = p.map(i, 0, fingerTrails.length - 1, 255, 100); // 计算透明度
    p.fill(255, alpha); // 设置填充颜色和透明度
    p.noStroke(); // 禁用描边
   
    p.circle(trail.x, trail.y, 5); // 绘制痕迹点
}

  const predictions = await model.estimateHands(video, true);
  if(predictions.length > 0 ){
    const hand = predictions[0]
  
    // 绘制连接线
p.stroke(255);
p.beginShape();
for (let landmark of hand.landmarks) {
    const [x, y, z] = landmark;
    p.vertex(x*2+p.windowWidth, y*2);
}
p.endShape(p.CLOSE); // 连接最后一个点和第一个点，形成闭合图形
    const estimatedGestures = GE.estimate(predictions[0].landmarks, 4);
    if(estimatedGestures['gestures'].length>0){
      console.log(estimatedGestures['gestures'])
    if(estimatedGestures['gestures'][0].name=='splayout'){
      fingerTrails=[]
      console.log('clear')
    }else if(estimatedGestures['gestures'].length==2){
      if(estimatedGestures['gestures'][0].score<estimatedGestures['gestures'][1].score){
      fingerTrails=[]
      console.log('clear')
      }else{
        index(hand)
      }
    }else {
      index(hand)

    }
  }
  }
}

function index(hand){
  let [x, y, z] = hand.landmarks[8];
      x=x*2+p.windowWidth
      y=y*2
      // 使用移动平均平滑手部位置
      smoothedX = smoothingFactor * smoothedX + (1 - smoothingFactor) * x;
      smoothedY = smoothingFactor * smoothedY + (1 - smoothingFactor) * y;

      p.circle(smoothedX, smoothedY, 20);
      fingerTrails.push({ x: smoothedX, y: smoothedY });
}

});


