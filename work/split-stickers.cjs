const sharp = require('sharp');
const fs = require('fs');
(async()=>{
 const file='public/images/y2k-stickers-sheet.png';
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h,channels:c}=info;
 const seen=new Uint8Array(w*h); const comps=[]; const stack=[];
 for(let i=0;i<w*h;i++){
   if(seen[i] || data[i*c+3]<20) continue;
   seen[i]=1; stack.push(i); let minX=w,maxX=0,minY=h,maxY=0,area=0;
   while(stack.length){const n=stack.pop(); const x=n%w,y=(n/w)|0; area++; if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const ni=yy*w+xx;if(!seen[ni]&&data[ni*c+3]>=20){seen[ni]=1;stack.push(ni)}}
   }
   if(area>700) comps.push({minX,maxX,minY,maxY,area,width:maxX-minX+1,height:maxY-minY+1});
 }
 comps.sort((a,b)=>a.minY-b.minY||a.minX-b.minX);
 fs.mkdirSync('public/images/stickers',{recursive:true});
 const useful=[];
 for(let i=0;i<comps.length;i++){const b=comps[i]; if(b.width<22||b.height<18)continue; const pad=10,left=Math.max(0,b.minX-pad),top=Math.max(0,b.minY-pad),width=Math.min(w-left,b.width+2*pad),height=Math.min(h-top,b.height+2*pad); const name=`sticker-${String(useful.length+1).padStart(2,'0')}.png`; await sharp(file).extract({left,top,width,height}).png().toFile(`public/images/stickers/${name}`); useful.push({...b,name}); }
 fs.writeFileSync('public/images/stickers/index.json',JSON.stringify(useful,null,2));
 console.log(`components=${comps.length} exported=${useful.length}`); console.log(useful.slice(0,50).map(x=>`${x.name}: ${x.width}x${x.height} @ ${x.minX},${x.minY}`).join('\n'));
})();
