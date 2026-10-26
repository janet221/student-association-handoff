const sharp=require('sharp');
(async()=>{for(let i=1;i<=41;i++){const n=`sticker-${String(i).padStart(2,'0')}.png`;await sharp(`public/images/stickers/${n}`).modulate({brightness:1.08,saturation:.55}).png().toFile(`public/images/stickers/soft-${String(i).padStart(2,'0')}.png`)}console.log('soft palette refreshed')})();
