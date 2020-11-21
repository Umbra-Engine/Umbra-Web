class Vector2{constructor(t=0,e=0){this.x=t,this.y=e,this.translate=t=>{this.x+=t.x,this.y+=t.y},Object.defineProperties(this,{range:{get:()=>Math.abs(this.x-this.y)}})}}class Bounds{constructor(t=new Vector2,e=new Vector2){this.min=t,this.max=e,this.contains=t=>t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y,this.intersects=t=>t.min.x<=this.max.x&&t.max.x>=this.min.x&&t.min.y<=this.max.y&&t.max.y>=this.min.y,this.translate=t=>{this.min.translate(t),this.max.translate(t)},Object.defineProperties(this,{width:{get:()=>this.max.x-this.min.x,set:t=>{this.max.x=this.min.x+t}},height:{get:()=>this.max.y-this.min.y,set:t=>{this.max.y=this.min.y+t}}})}}class Umbra{constructor(t,e,s="Umbra v"+Umbra.version,i="#000",n=[],a=60,o={x:innerWidth,y:innerHeight}){Umbra.instance=this,this.state,this.isPaused=!1;let r=Date.now(),h=a/1e3,c=0;this.updates=[];const d=()=>{requestAnimationFrame(d,this.canvas);const t=Date.now();let e=t-r;for(e>1e3&&(e=h),r=t,c+=e;c>h;)this.updates.forEach(t=>t()),!this.paused&&this.state&&this.state(),c-=h;this.camera.render()};if(document.title=s,document.body.style="margin:0;",this.canvas=document.createElement("canvas"),this.canvas.style=`background-color:${i};touch-action:none;`,this.canvas.width=o.x,this.canvas.height=o.y,document.body.appendChild(this.canvas),this.context=this.canvas.getContext("2d"),this.scene=new UObject,this.camera,this.actx=new AudioContext,"suspended"==this.actx.state){const t=document.createElement("button");t.style="position:fixed;top:0;left:0;width:10%;height:10%;",t.innerHTML="Click to enable audio.",t.onclick=()=>this.actx.resume().then(()=>document.body.removeChild(t)),document.body.appendChild(t)}this.pointer,this.interactableObjects=[],this.assets={},this.start=()=>{n.length>0?(()=>{this.state=e;let s=0;const i=()=>{++s>=n.length&&(this.state=void 0,t&&t())},a=["json"],o=["ttf","otf","ttc","woff"],r=["png","jpg","gif","webp"],h=["mp3","ogg","wav","webm"];for(let t=0;t<n.length;t++){const e=n[t],s=e.split(".").pop();if(a.indexOf(s)>-1){const t=new XMLHttpRequest;t.open("GET",e),t.addEventListener("readystatechange",()=>{200==t.status&&4==t.readyState&&(this.assets[e]=JSON.parse(t.responseText),i())}),t.send()}else if(o.indexOf(s)>-1){const t=e.split("/").pop().split(".")[0],s=document.createElement("style");s.innerHTML=`@font-face{font-family:${t};src:url(${e});}`,document.head.appendChild(s),i()}else if(r.indexOf(s)>-1){const t=new Image;t.addEventListener("load",()=>{this.assets[e]=t,i()}),t.src=e}else if(h.indexOf(s)>-1){const t=new USound(e,i);this.assets[e]=t}}})():t&&t(),d()},this.camera=new UCamera,this.pointer=new UPointer}}Umbra.prototype.version="2.3.1";class UCamera{constructor(t=new Bounds(new Vector2,new Vector2(Umbra.instance.canvas.width,Umbra.instance.canvas.height))){this.bounds=t,this.sPToG=t=>new Vector2(t.x/this.scale.x+this.bounds.min.x,t.y/this.scale.y+this.bounds.min.y),this.gPToS=t=>new Vector2((t.x-this.bounds.min.x)*this.scale.x,(t.y-this.bounds.min.y)*this.scale.y),this.sBToG=t=>new Bounds(this.sPToG(t.min),this.sPToG(t.max)),this.gBToS=t=>new Bounds(this.gPToS(t.min),this.gPToS(t.max)),this.render=()=>{const t=Umbra.instance.canvas;Umbra.instance.context.clearRect(0,0,t.width,t.height),Umbra.instance.scene.display()},Object.defineProperties(this,{scale:{get:()=>new Vector2(Umbra.instance.canvas.width/this.bounds.width,Umbra.instance.canvas.height/this.bounds.height)}})}}class UShadow{constructor(t="rgba(100, 100, 100, 0.5)",e=new Vector2(3,3),s=3){this.color=t,this.offset=e,this.blur=s}}class UObject{constructor(t=new Bounds,e=Umbra.instance.scene){this.isActive=!0;let s,i,n=0;this.doClip=!1,this.fillColor="white",this.lineColor="white",this.lineWidth=1,this.translate=t=>{this.bounds.translate(t),this.childBox=this.bounds,this.children.forEach(e=>{e.translate(t),this.childBox.min.x=Math.min(this.childBox.min.x,e.childBox.min.x),this.childBox.min.y=Math.min(this.childBox.min.y,e.childBox.min.y),this.childBox.max.x=Math.max(this.childBox.max.x,e.childBox.max.x),this.childBox.max.y=Math.max(this.childBox.max.y,e.childBox.max.y)})},this.children=[],this.childBox=t,e&&e.children.push(this),this.display=()=>{Umbra.instance.camera;const t=Umbra.instance.context;Umbra.instance.camera.gBToS(this.bounds),this.isActive&&new Bounds(new Vector2,new Vector2(t.canvas.width,t.canvas.height)).intersects(this.childBox)&&(t.save(),t.globalAlpha=this.alpha,t.rotate(this.rotation),t.scale(this.scale.x,this.scale.y),this.shadow&&(t.shadowColor=this.shadow.color,t.shadowOffsetX=this.shadow.offset.x,t.shadowOffsetY=this.shadow.offset.y,t.shadowBlur=this.shadow.blur),this.compositeOperation&&(t.globalCompositeOperation=this.compositeOperation),t.strokeStyle=this.lineColor,t.lineWidth=this.lineWidth,t.fillStyle=this.fillColor,t.beginPath(),this.render&&this.render(t),this.doClip?t.clip():("none"!=this.lineColor&&t.stroke(),"none"!=this.fillColor&&t.fill()),t.stroke(),this.children.forEach(t=>t.display()),t.restore())},this.render,this.scale=new Vector2(1,1),this.shadow,this.compositeOperation,this.alpha=1,this.isDown=!1;const a=()=>{this.onClick||this.onRelease?Umbra.instance.interactableObjects.push(this):Umbra.instance.interactableObjects.splice(Umbra.instance.interactableObjects.indexOf(this),1)};Object.defineProperties(this,{bounds:{get:()=>t,set:t=>{const e=new Vector2(t.min.x-this.bounds.min.x,t.min.y-this.bounds.min.y);this.translate(e)}},layer:{get:()=>n,set:t=>{n=t,this.parent.children.sort((t,e)=>t.layer<e.layer?-1:1)}},parent:{get:()=>e,set:t=>{this.parent&&this.parent.children.splice(this.parent.children.indexOf(this),1),e=t,this.parent&&this.parent.children.push(this)}},onClick:{get:()=>s,set:t=>{s=t,a()}},onRelease:{get:()=>i,set:t=>{i=t,a()}}})}}class URect extends UObject{constructor(t=new Bounds,e=Umbra.instance.scene){super(t,e),this.render=t=>{const e=Umbra.instance.camera.gBToS(this.bounds);t.rect(e.min.x,e.min.y,e.width,e.height)}}}class UCircle extends UObject{constructor(t=new Bounds,e=Umbra.instance.scene){super(t,e),this.render=t=>{const e=Umbra.instance.camera.gBToS(this.bounds),s=Math.max(e.width,e.height)/2;t.arc(e.min.x+s,e.min.y+s,s,0,2*Math.PI)}}}class ULine extends UObject{constructor(t=new Bounds,e=Umbra.instance.scene){super(t,e),this.render=t=>{const e=Umbra.instance.camera.gBToS(this.bounds);t.moveTo(e.min.x,e.min.y),t.lineTo(e.max.x,e.max.y)}}}class UText extends UObject{constructor(t,e=new Bounds,s=Umbra.instance.scene){super(e,s),this.text=t,this.font="20px courier",this.baseline="top",this.render=t=>{const e=Umbra.instance.camera.gBToS(this.bounds);e.width=t.measureText(this.text).width,e.height=t.measureText("M").width,t.font=this.font,t.textBaseline=this.baseline,t.fillText(this.text,e.min.x,e.min.y)}}}class USpritesheet{constructor(t,e=new Vector2){this.source=t,this.frameSize=e,this.positions=[],this.size=new Vector2(this.source.width/this.frameSize.x,this.source.height/this.frameSize.y);for(var s=0;s<this.size.x;s++)for(var i=0;i<this.size.y;i++)this.positions.push(new Vector2(s*this.frameSize.x,i*this.frameSize.y))}}class USprite extends UObject{constructor(t,e=new Bounds,s=Umbra.instance.scene){super(e,s),this.sheet=t;let i=!1;this.loopRange=new Vector2(0,this.sheet.positions.length),this.fps=1;let n,a=0,o=this.sheet.positions[a];Object.defineProperties(this,{doLoop:{get:()=>i,set:t=>{i=t,this.doLoop?n=setInterval(()=>{let t=this.frame+1;t>=this.sheet.positions.length&&(t=0),this.frame=t},1e3/this.fps):clearInterval(n)}},frame:{get:()=>a,set:t=>{a=t,o=this.sheet.positions[this.frame]}}}),this.render=t=>{const e=Umbra.instance.camera.gBToS(this.bounds);t.drawImage(this.sheet.source,o.x,o.y,this.sheet.frameSize.x,this.sheet.frameSize.y,e.min.x,e.min.y,e.width,e.height)}}}class UPointer{constructor(){this.pos=new Vector2,this.isDown=!1,this.isTapped=!1;const t=Umbra.instance.canvas;this.onPress,this.onRelease;const e=e=>e.targetTouches?new Vector2(e.targetTouches[0].pageX-t.offsetLeft,e.targetTouches[0].pageY-t.offsetTop):new Vector2(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop),s=t=>{this.pos=e(t),t.preventDefault()},i=t=>{this.pos=e(t),this.isDown=!0,this.onPress&&this.onPress(),Umbra.instance.interactableObjects.forEach(t=>{this.isTouching(t)&&!t.isDown&&(t.isDown=!0,t.onClick&&t.onClick())}),t.preventDefault()},n=t=>{this.isDown=!1,this.onRelease&&this.onRelease(),Umbra.instance.interactableObjects.forEach(t=>{this.isTouching(t)&&t.isDown&&(t.isDown=!1,t.onRelease&&t.onRelease())}),t.preventDefault()};t.addEventListener("mousemove",s),t.addEventListener("touchmove",s),t.addEventListener("mousedown",i),t.addEventListener("touchstart",i),window.addEventListener("mouseup",n),window.addEventListener("touchend",n),this.isTouching=t=>Umbra.instance.camera.gBToS(t.bounds).contains(this.pos)}}class UKey{constructor(t){this.isDown=!1,this.onPress,this.onRelease,window.addEventListener("keydown",e=>{e.keyCode==t&&(!this.isDown&&this.onPress&&this.onPress(),this.isDown=!0,e.preventDefault())}),window.addEventListener("keyup",e=>{e.keyCode==t&&(this.isDown&&this.onRelease&&this.onRelease(),this.isDown=!1,e.preventDefault())})}}class UEcho{constructor(t=.3,e=.3,s=0){let i=Umbra.instance.actx;this.delay=i.createDelay(),this.delay.delayTime.value=t,this.feedback=i.createGain(),this.feedback.gain.value=e,this.filter=i.createBiquadFilter(),this.filter.frequency.value=s}}class USound{constructor(t,e){const s=Umbra.instance.actx;let i;this.volume=s.createGain(),this.sound;let n=!1;this.pan=s.createPanner(),this.convolver=s.createConvolver(),this.echo,this.reverb,Object.defineProperties(this,{isPlaying:{get:()=>n,set:t=>{n=t,this.isPlaying?(this.sound=s.createBufferSource(),this.sound.buffer=i,this.sound.connect(this.volume),this.reverb?(this.volume.connect(this.convolver),this.convolver.connect(this.pan),this.convolver.buffer=this.reverb):this.volume.connect(this.pan),this.pan?this.pan.connect(s.destination):this.volume.connect(s.destination),this.echo&&(this.echo.delay.connect(this.echo.feedback),this.echo.filter.frequency.value>0?(this.echo.feedback.connect(this.echo.filter),this.echo.filter.connect(this.delay)):this.echo.feedback.connect(this.delay),this.volume.connect(this.echo.delay),this.echo.delay.connect(this.pan)),this.sound.start()):this.sound.stop()}}});const a=new XMLHttpRequest;a.open("GET",t),a.responseType="arraybuffer",a.addEventListener("load",()=>{s.decodeAudioData(a.response,t=>{i=t,e&&e()})}),a.send()}}function C(t,e,s){return s=t.createShader(s),t.shaderSource(s,e),t.compileShader(s),s}function D(t,e,s){var i=t.createProgram();return e=C(t,e,35633),s=C(t,s,35632),t.attachShader(i,e),t.attachShader(i,s),t.linkProgram(i),i}function F(t,e,s,i){var n=t.createBuffer();return t.bindBuffer(e,n),t.bufferData(e,s,i),n}window.TCShd=C,window.TCPrg=D,window.TCBuf=F,window.TCTex=function(t,e,s,i){var n=t.createTexture();return t.bindTexture(3553,n),t.texParameteri(3553,10242,33071),t.texParameteri(3553,10243,33071),t.texParameteri(3553,10240,9728),t.texParameteri(3553,10241,9728),t.texImage2D(3553,0,6408,6408,5121,e),t.bindTexture(3553,null),n.width=s,n.height=i,n},window.TC=function(t){var e=t.getContext("webgl"),s=t.width,i=t.height,n=D(e,"precision lowp float;\nattribute vec2 a, b;\nattribute vec4 c;\nvarying vec2 d;\nvarying vec4 e;\nuniform mat4 m;\nuniform vec2 r;\nvoid main(){\ngl_Position=m*vec4(a,1.0,1.0);\nd=b;\ne=c;\n}","precision lowp float;\nvarying vec2 d;\nvarying vec4 e;\nuniform sampler2D f;\nvoid main(){\ngl_FragColor=texture2D(f,d)*e;\n}"),a=e.bufferSubData.bind(e),o=e.drawElements.bind(e),r=e.bindTexture.bind(e),h=e.clear.bind(e),c=e.clearColor.bind(e),d=new ArrayBuffer(873760),l=new Float32Array(d),m=new Uint32Array(d),u=new Uint16Array(131064),b=F(e,34963,u.byteLength,35044),f=F(e,34962,d.byteLength,35048),x=0,p=new Float32Array([1,0,0,1,0,0]),w=new Float32Array(100),y=0,g=Math.cos,v=Math.sin,U=null,B=null;for(e.blendFunc(770,771),e.enable(3042),e.useProgram(n),e.bindBuffer(34963,b),b=indexB=0;65532>b;b+=6,indexB+=4)u[b+0]=indexB,u[b+1]=indexB+1,u[b+2]=indexB+2,u[b+3]=indexB+0,u[b+4]=indexB+3,u[b+5]=indexB+1;return a(34963,0,u),e.bindBuffer(34962,f),u=e.getAttribLocation(n,"a"),f=e.getAttribLocation(n,"b"),b=e.getAttribLocation(n,"c"),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,5126,0,20,0),e.enableVertexAttribArray(f),e.vertexAttribPointer(f,2,5126,0,20,8),e.enableVertexAttribArray(b),e.vertexAttribPointer(b,4,5121,1,20,16),e.uniformMatrix4fv(e.getUniformLocation(n,"m"),0,new Float32Array([2/s,0,0,0,0,-2/i,0,0,0,0,1,1,-1,1,0,0])),e.activeTexture(33984),B={g:e,c:t,col:4294967295,bkg:function(t,e,s){c(t,e,s,1)},cls:function(){h(16384)},trans:function(t,e){p[4]=p[0]*t+p[2]*e+p[4],p[5]=p[1]*t+p[3]*e+p[5]},scale:function(t,e){p[0]*=t,p[1]*=t,p[2]*=e,p[3]*=e},rot:function(t){var e=p[0],s=p[1],i=p[2],n=p[3],a=v(t);t=g(t),p[0]=e*t+i*a,p[1]=s*t+n*a,p[2]=e*-a+i*t,p[3]=s*-a+n*t},push:function(){w[y+0]=p[0],w[y+1]=p[1],w[y+2]=p[2],w[y+3]=p[3],w[y+4]=p[4],w[y+5]=p[5],y+=6},pop:function(){y-=6,p[0]=w[y+0],p[1]=w[y+1],p[2]=w[y+2],p[3]=w[y+3],p[4]=w[y+4],p[5]=w[y+5]},img:function(t,e,s,i,n,h,c,u,b){var f=e+i,w=s+n;n=s+n,i=e+i;var y=p[0],g=p[1],v=p[2],T=p[3],C=p[4],P=p[5],S=B.col;(t!=U||10922<=x+1)&&(a(34962,0,d),o(4,6*x,5123,0),x=0,U!=t&&r(3553,U=t)),t=20*x,l[t++]=e*y+s*v+C,l[t++]=e*g+s*T+P,l[t++]=h,l[t++]=c,m[t++]=S,l[t++]=f*y+w*v+C,l[t++]=f*g+w*T+P,l[t++]=u,l[t++]=b,m[t++]=S,l[t++]=e*y+n*v+C,l[t++]=e*g+n*T+P,l[t++]=h,l[t++]=b,m[t++]=S,l[t++]=i*y+s*v+C,l[t++]=i*g+s*T+P,l[t++]=u,l[t++]=c,m[t++]=S,10922<=++x&&(a(34962,0,d),o(4,6*x,5123,0),x=0)},flush:function(){0!=x&&(a(34962,0,l.subarray(0,20*x)),o(4,6*x,5123,0),x=0)}}};